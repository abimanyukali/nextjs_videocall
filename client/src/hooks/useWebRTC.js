'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'simple-peer';
import { connectSocket, getSocket } from '../lib/socket';
import { ICE_CONFIG } from '../constants/config';

const MAX_CALL_SECONDS = 60; // 1 minute per call

export const useWebRTC = (token, isPremiumUser = false) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, waiting, connecting, paired
  const [error, setError] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callTimeLeft, setCallTimeLeft] = useState(null); // countdown in seconds
  const [isPremium, setIsPremium] = useState(isPremiumUser);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const roomIdRef = useRef(null);
  const pairingInfoRef = useRef(null);
  const peerIdRef = useRef(null);
  const callTimerRef = useRef(null);
  const countdownRef = useRef(null);

  // ---- Clear call timer + countdown ----
  const clearCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearTimeout(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCallTimeLeft(null);
  }, []);

  const cleanupPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setRemoteStream(null);
    clearCallTimer();
  }, [clearCallTimer]);

  const resetRoomContext = useCallback(() => {
    roomIdRef.current = null;
    peerIdRef.current = null;
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
          }
        }
      }, 500);

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
              const sender = peer._pc.getSenders().find((s) => s.track?.kind === 'video');
              if (!sender) return;
              const params = sender.getParameters();
              if (!params.encodings) params.encodings = [{}];
              if (lossRate > 10) {
                params.encodings[0].maxBitrate = 1500000;
              } else if (lossRate > 5) {
                params.encodings[0].maxBitrate = 3000000;
              } else {
                params.encodings[0].maxBitrate = 5000000;
              }
              sender.setParameters(params);
            }
          });
        }, 5000);
        peer.on('close', () => clearInterval(interval));
      };

      peer.on('signal', (data) => {
        if (socketRef.current) {
          socketRef.current.emit('signal', { roomId, signal: data });
        }
      });

      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      peer._pc.oniceconnectionstatechange = () => {
        const state = peer._pc.iceConnectionState;
        if (state === 'failed' || state === 'disconnected') {
          peer._pc.restartIce();
        }
      };

      peer.on('connect', async () => {
        const sender = peer._pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          const params = sender.getParameters();
          if (!params.encodings) params.encodings = [{}];
          params.encodings[0].maxBitrate = 5000000;
          params.encodings[0].maxFramerate = 30;
          params.encodings[0].scaleResolutionDownBy = 1;
          await sender.setParameters(params);
        }
        monitorNetwork();
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        setError('P2P Connection Error');
        if (roomIdRef.current && streamRef.current && peerIdRef.current) {
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

      if (pairingInfoRef.current) {
        const { roomId, peerId } = pairingInfoRef.current;
        const isInitiator = getSocket(token).id < peerId;
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
  }, [createPeer, token]);

  // ---- Switch Camera (Premium only) ----
  const switchCamera = useCallback(async () => {
    if (!isPremium) return;
    try {
      const currentTrack = streamRef.current?.getVideoTracks()[0];
      const currentFacingMode = currentTrack?.getSettings()?.facingMode;
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace track in local stream
      if (streamRef.current) {
        const oldTrack = streamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          streamRef.current.removeTrack(oldTrack);
          oldTrack.stop();
        }
        streamRef.current.addTrack(newVideoTrack);
      }

      // Replace in peer connection
      if (peerRef.current && peerRef.current._pc) {
        const sender = peerRef.current._pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(newVideoTrack);
      }

      setLocalStream(streamRef.current ? new MediaStream(streamRef.current.getTracks()) : null);
      setIsVideoOff(false);
    } catch (err) {
      console.error('Switch camera error:', err);
      setError('Failed to switch camera');
    }
  }, [isPremium]);

  const join = useCallback(() => {
    if (socketRef.current) {
      setStatus('connecting');
      socketRef.current.emit('join');
    }
  }, []);

  const skip = useCallback(() => {
    if (socketRef.current) {
      cleanupPeer();
      resetRoomContext();
      socketRef.current.emit('skip');
    }
  }, [cleanupPeer, resetRoomContext]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      cleanupPeer();
      resetRoomContext();
      socketRef.current.emit('disconnect-call');
      setStatus('idle');
    }
  }, [cleanupPeer, resetRoomContext]);

  const report = useCallback(() => {
    if (socketRef.current && roomIdRef.current) {
      socketRef.current.emit('report', { roomId: roomIdRef.current });
      cleanupPeer();
      resetRoomContext();
      setStatus('waiting');
    }
  }, [cleanupPeer, resetRoomContext]);

  const block = useCallback(() => {
    if (socketRef.current && roomIdRef.current) {
      socketRef.current.emit('block', { roomId: roomIdRef.current });
      cleanupPeer();
      resetRoomContext();
      setStatus('waiting');
    }
  }, [cleanupPeer, resetRoomContext]);

  // Only premium users can toggle audio
  const toggleAudio = useCallback(() => {
    if (!isPremium) return;
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, [isPremium]);

  // Only premium users can toggle video
  const toggleVideo = useCallback(() => {
    if (!isPremium) return;
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, [isPremium]);

  // Initial media and socket setup
  useEffect(() => {
    if (!token) return;

    initMedia();

    const socket = connectSocket(token);
    socketRef.current = socket;

    const interval = setInterval(() => {
      if (socket.connected) socket.emit('ping-test');
    }, 15000);

    socket.on('waiting', () => {
      setStatus('waiting');
    });

    socket.on('paired', ({ roomId, peerId, isPremium: userIsPremium }) => {
      roomIdRef.current = roomId;
      peerIdRef.current = peerId;
      setStatus('paired');
      setIsPremium(!!userIsPremium);

      // Start client-side countdown display
      clearCallTimer();
      setCallTimeLeft(MAX_CALL_SECONDS);
      countdownRef.current = setInterval(() => {
        setCallTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const currentStream = streamRef.current;
      if (currentStream) {
        const isInitiator = socket.id < peerId;
        createPeer(isInitiator, roomId, currentStream);
      } else {
        pairingInfoRef.current = { roomId, peerId };
      }
    });

    socket.on('signal', ({ roomId, signal }) => {
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
      resetRoomContext();
      setStatus('waiting');
    });

    // Server timed out the call (1 minute limit)
    socket.on('call-time-up', ({ message }) => {
      console.log('Call time up:', message);
      cleanupPeer();
      resetRoomContext();
      setStatus('idle');
      setError(message);
    });

    socket.on('error', (msg) => {
      setError(msg);
    });

    return () => {
      clearInterval(interval);
      clearCallTimer();
      socket.off('waiting');
      socket.off('paired');
      socket.off('signal');
      socket.off('peer-disconnected');
      socket.off('call-time-up');
      socket.off('error');
      cleanupPeer();
      resetRoomContext();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initMedia, createPeer, cleanupPeer, resetRoomContext, token, clearCallTimer]);

  return {
    localStream,
    remoteStream,
    status,
    error,
    isAudioMuted,
    isVideoOff,
    callTimeLeft,
    isPremium,
    join,
    skip,
    disconnect,
    report,
    block,
    toggleAudio,
    toggleVideo,
    switchCamera,
    retryMedia: initMedia,
  };
};
