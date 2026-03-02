'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'simple-peer';
import { connectSocket, getSocket } from '../lib/socket';
import { ICE_CONFIG } from '../constants/config';

export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, waiting, connecting, paired
  const [error, setError] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const roomIdRef = useRef(null);
  const pairingInfoRef = useRef(null); // Store pairing info if media isn't ready

  const peerIdRef = useRef(null);

  const cleanupPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setRemoteStream(null);
    roomIdRef.current = null;
    pairingInfoRef.current = null;
  }, []);

  const createPeer = useCallback(
    (initiator, roomId, stream) => {
      if (peerRef.current) cleanupPeer();

      const peer = new Peer({
        initiator,
        trickle: true,
        config: ICE_CONFIG,
        stream: stream,
        sdpTransform: (sdp) => {
          return sdp.replace(/b=AS:\d+/g, 'b=AS:5000');
        },
      });

      // 🔥 Prefer VP9 codec (better compression)
      setTimeout(() => {
        const transceiver = peer._pc
          .getTransceivers()
          .find((t) => t.sender?.track?.kind === 'video');

        if (transceiver) {
          const codecs = RTCRtpSender.getCapabilities('video').codecs;

          const preferred = codecs.filter(
            (c) => c.mimeType === 'video/VP9' || c.mimeType === 'video/H264',
          );

          if (preferred.length) {
            transceiver.setCodecPreferences(preferred);
            console.log('Preferred VP9/H264 set 🎥');
          }
        }
      }, 500);

      // 🔥 NETWORK MONITOR FUNCTION
      const monitorNetwork = () => {
        let lastPacketsSent = 0;
        let lastPacketsLost = 0;

        const interval = setInterval(async () => {
          if (!peer._pc) return;

          const stats = await peer._pc.getStats();

          stats.forEach((report) => {
            if (report.type === 'outbound-rtp' && report.kind === 'video') {
              const packetsSent = report.packetsSent || 0;
              const packetsLost = report.packetsLost || 0;

              const sentDiff = packetsSent - lastPacketsSent;
              const lostDiff = packetsLost - lastPacketsLost;

              lastPacketsSent = packetsSent;
              lastPacketsLost = packetsLost;

              const lossRate = sentDiff > 0 ? (lostDiff / sentDiff) * 100 : 0;

              const sender = peer._pc
                .getSenders()
                .find((s) => s.track?.kind === 'video');

              if (!sender) return;

              const params = sender.getParameters();
              if (!params.encodings) params.encodings = [{}];

              if (lossRate > 10) {
                params.encodings[0].maxBitrate = 1500000; // Medium quality
              } else if (lossRate > 5) {
                params.encodings[0].maxBitrate = 3000000; // Good quality
              } else {
                params.encodings[0].maxBitrate = 5000000; // Full HD
              }

              sender.setParameters(params);
            }
          });
        }, 5000);

        peer.on('close', () => clearInterval(interval));
      };
      // Signaling
      peer.on('signal', (data) => {
        if (socketRef.current) {
          socketRef.current.emit('signal', { roomId, signal: data });
        }
      });
      // receive remote stream
      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      peer._pc.oniceconnectionstatechange = () => {
        const state = peer._pc.iceConnectionState;
        console.log('ICE State:', state);

        if (state === 'failed' || state === 'disconnected') {
          console.log('Restarting ICE...');
          peer._pc.restartIce();
        }
      };

      // 🔥 INCREASE BITRATE FOR HD
      peer.on('connect', async () => {
        const sender = peer._pc
          .getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          const params = sender.getParameters();
          if (!params.encodings) params.encodings = [{}];

          params.encodings[0].maxBitrate = 5000000; // 5 Mbps
          params.encodings[0].maxFramerate = 30;
          params.encodings[0].scaleResolutionDownBy = 1;

          await sender.setParameters(params);
          console.log('Bitrate upgraded 🚀');
        }
        monitorNetwork();
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        setError('P2P Connection Error');
        // 🔥 Auto reconnect logic
        if (roomIdRef.current && streamRef.current && peerIdRef.current) {
          console.log('Reconnecting peer...');
          const isInitiator = socketRef.current.id < peerIdRef.current;
          createPeer(isInitiator, roomIdRef.current, streamRef.current);
        }
      });

      peer.on('close', () => {
        cleanupPeer();
      });

      peerRef.current = peer;
      return peer;
    },
    [cleanupPeer],
  );

  const initMedia = useCallback(async () => {
    setError(null);

    // Safety check for mobile (non-secure context)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = window.isSecureContext
        ? 'Camera/Microphone access is not supported by your browser.'
        : 'Camera/Microphone access requires a secure context (HTTPS or localhost).';
      setError(errorMsg);
      return null;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          autoGainControl: true,
          channelCount: 2,
        },
      });
      setLocalStream(stream);
      streamRef.current = stream;

      // If we were already paired but waiting for media, create peer now
      if (pairingInfoRef.current) {
        const { roomId, peerId } = pairingInfoRef.current;
        const isInitiator = getSocket().id < peerId;
        createPeer(isInitiator, roomId, stream);
        pairingInfoRef.current = null;
      }

      return stream;
    } catch (err) {
      console.error('Media init error:', err);
      const msg =
        err.name === 'NotReadableError'
          ? 'Camera or Microphone is busy.'
          : err.name === 'NotAllowedError'
            ? 'Access denied. Please enable permissions.'
            : `Media error: ${err.message}`;
      setError(msg);
      return null;
    }
  }, [createPeer]);

  const join = useCallback(() => {
    if (socketRef.current) {
      setStatus('connecting');
      socketRef.current.emit('join');
    }
  }, []);

  const skip = useCallback(() => {
    if (socketRef.current) {
      cleanupPeer();
      socketRef.current.emit('skip');
    }
  }, [cleanupPeer]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      cleanupPeer();
      socketRef.current.disconnect();
      socketRef.current = null;
      setStatus('idle');
    }
  }, [cleanupPeer]);

  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  // Initial media and socket setup
  useEffect(() => {
    initMedia();

    const socket = connectSocket();
    socketRef.current = socket;

    // 🔥 KEEPALIVE PING (prevents silent disconnect)
    const interval = setInterval(() => {
      socket.emit('ping-test');
    }, 15000);

    socket.on('waiting', () => {
      setStatus('waiting');
    });

    socket.on('paired', ({ roomId, peerId }) => {
      roomIdRef.current = roomId;
      peerIdRef.current = peerId; // ✅ ADD THIS
      setStatus('paired');

      const currentStream = streamRef.current;
      if (currentStream) {
        const isInitiator = socket.id < peerId;
        createPeer(isInitiator, roomId, currentStream);
      } else {
        // Media not ready yet, store info and wait for initMedia to finish
        pairingInfoRef.current = { roomId, peerId };
      }
    });

    socket.on('signal', ({ roomId, signal }) => {
      // Critical check to avoid processing old signals from closed rooms
      if (roomIdRef.current !== roomId) {
        console.warn(`Ignored signal for old/mismatched room: ${roomId}`);
        return;
      }
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });

    socket.on('peer-disconnected', () => {
      cleanupPeer();
      setStatus('waiting');
    });

    socket.on('error', (msg) => {
      setError(msg);
    });

    return () => {
      clearInterval(interval);
      socket.off('waiting');
      socket.off('paired');
      socket.off('signal');
      socket.off('peer-disconnected');
      socket.off('error');
      cleanupPeer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initMedia, createPeer, cleanupPeer]);

  return {
    localStream,
    remoteStream,
    status,
    error,
    isAudioMuted,
    isVideoOff,
    join,
    skip,
    disconnect,
    toggleAudio,
    toggleVideo,
    retryMedia: initMedia,
  };
};
