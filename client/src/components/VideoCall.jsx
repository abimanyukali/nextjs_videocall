'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import {
  Videocam as VideoIcon,
  VideocamOff as VideoOffIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  SkipNext as SkipIcon,
  CallEnd as PhoneOffIcon,
  PlayArrow as PlayIcon,
  Person as UserIcon,
  Autorenew as LoaderIcon,
  ReportProblem as ReportIcon,
  Block as BlockIcon,
  Cameraswitch as SwitchCameraIcon,
  WorkspacePremium as PremiumIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';

const VideoCall = ({ token, isPremiumUser = false }) => {
  const {
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
    retryMedia,
  } = useWebRTC(token, isPremiumUser);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [showPremiumTooltip, setShowPremiumTooltip] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, status]);

  // Format countdown as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Timer color based on urgency
  const timerColor = callTimeLeft !== null
    ? callTimeLeft <= 10 ? 'text-red-400' : callTimeLeft <= 30 ? 'text-amber-400' : 'text-emerald-400'
    : '';

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden font-sans text-white">
      {/* Remote Video Layer (Background) */}
      <div className="absolute inset-0 z-0 bg-black">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain transition-opacity duration-1000 ease-in-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 to-black">
            <div className="flex flex-col items-center justify-center animate-pulse opacity-70">
              {status === 'waiting' || status === 'connecting' ? (
                <LoaderIcon className="animate-spin text-6xl md:text-8xl text-indigo-500/50 mb-6" />
              ) : (
                <div className="w-24 md:w-32 aspect-square rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-2xl">
                  <UserIcon className="text-5xl md:text-7xl text-slate-500" />
                </div>
              )}
              <h2 className="text-lg md:text-2xl font-light tracking-[0.2em] uppercase text-white/50 text-center px-4">
                {status === 'waiting'
                  ? 'Waiting for someone...'
                  : status === 'connecting'
                    ? 'Connecting to peer...'
                    : 'Ready to connect'}
              </h2>
            </div>
          </div>
        )}
      </div>

      {/* Local Video (Floating Top Right) */}
      {localStream && (
        <div className="absolute z-10 top-6 right-6 md:top-auto md:bottom-32 md:right-8 w-28 md:w-56 lg:w-72 aspect-[3/4] md:aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300">
          {!isVideoOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80">
              <VideoOffIcon className="text-3xl md:text-5xl text-white/40" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] uppercase font-bold text-white/80">
            You {isPremium && <span className="text-yellow-400 ml-1">⭐</span>}
          </div>
        </div>
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/30" />

      {/* Error Overlay */}
      {error && (
        <div className="absolute top-0 left-0 w-full z-50 p-4">
          <div className="max-w-md mx-auto bg-red-600/90 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={() => retryMedia()}
              className="px-4 py-2 bg-white text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Status + Safety Actions (Top Left) */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
          <div
            className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] ${status === 'paired'
              ? 'bg-emerald-500 animate-pulse'
              : status === 'waiting' || status === 'connecting'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-slate-500'
              }`}
          />
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">
            {status}
          </span>
        </div>

        {/* Call countdown timer */}
        {status === 'paired' && callTimeLeft !== null && (
          <div className={`flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-2 rounded-full border ${callTimeLeft <= 10 ? 'border-red-500/50 animate-pulse' : 'border-white/10'}`}>
            <TimerIcon className={`text-sm ${timerColor}`} />
            <span className={`text-sm font-black tabular-nums ${timerColor}`}>
              {formatTime(callTimeLeft)}
            </span>
          </div>
        )}

        {/* Safety Actions */}
        {status === 'paired' && (
          <div className="flex flex-col gap-2">
            <button onClick={report} className="flex items-center gap-2 px-3 py-2 bg-black/50 hover:bg-red-900/80 backdrop-blur-md rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition group border border-transparent hover:border-red-500/50">
              <ReportIcon className="text-sm group-hover:text-red-400" /> Report
            </button>
            <button onClick={block} className="flex items-center gap-2 px-3 py-2 bg-black/50 hover:bg-orange-900/80 backdrop-blur-md rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition group border border-transparent hover:border-orange-500/50">
              <BlockIcon className="text-sm group-hover:text-orange-400" /> Block
            </button>
          </div>
        )}
      </div>

      {/* Branding ARL (Bottom Left) */}
      <div className="absolute bottom-32 md:bottom-10 left-6 z-20 flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center text-white text-[12px] font-black shadow-inner">
          <span className="drop-shadow-md">A</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-[0.2em] text-white leading-none">ARL</span>
          <span className="text-[10px] text-white/50 tracking-widest font-medium">NETWORK</span>
        </div>
      </div>

      {/* Premium Upgrade hint (Non-premium, idle) */}
      {!isPremium && status === 'paired' && (
        <div className="absolute bottom-32 md:bottom-10 right-6 z-20">
          <a
            href="/premium"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-2xl border border-indigo-400/30 hover:scale-105 transition-transform"
          >
            <PremiumIcon className="text-sm text-yellow-300" />
            Upgrade for mic/camera controls
          </a>
        </div>
      )}

      {/* Floating Bottom Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-lg">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 p-3 md:p-4 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] w-full">
          {status === 'idle' ? (
            <button
              onClick={join}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/30"
            >
              <PlayIcon className="text-2xl" />
              <span>START CHAT</span>
            </button>
          ) : (
            <>
              {/* Audio Toggle — Premium Only */}
              {isPremium ? (
                <button
                  onClick={toggleAudio}
                  title="Toggle Microphone"
                  className={`rounded-full p-4 transition-all duration-300 shadow-lg flex items-center justify-center ${isAudioMuted
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  {isAudioMuted ? <MicOffIcon className="text-[28px]" /> : <MicIcon className="text-[28px]" />}
                </button>
              ) : (
                <button
                  title="Microphone controls are Premium only"
                  onClick={() => setShowPremiumTooltip(true)}
                  className="rounded-full p-4 bg-white/5 text-white/20 cursor-not-allowed flex items-center justify-center border border-white/10 relative"
                >
                  <MicIcon className="text-[28px]" />
                  <span className="absolute -top-1 -right-1 text-[10px] bg-yellow-500 text-black font-black rounded-full w-4 h-4 flex items-center justify-center">⭐</span>
                </button>
              )}

              {/* Video Toggle — Premium Only */}
              {isPremium ? (
                <button
                  onClick={toggleVideo}
                  title="Toggle Camera"
                  className={`rounded-full p-4 transition-all duration-300 shadow-lg flex items-center justify-center ${isVideoOff
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  {isVideoOff ? <VideoOffIcon className="text-[28px]" /> : <VideoIcon className="text-[28px]" />}
                </button>
              ) : (
                <button
                  title="Camera controls are Premium only"
                  onClick={() => setShowPremiumTooltip(true)}
                  className="rounded-full p-4 bg-white/5 text-white/20 cursor-not-allowed flex items-center justify-center border border-white/10 relative"
                >
                  <VideoIcon className="text-[28px]" />
                  <span className="absolute -top-1 -right-1 text-[10px] bg-yellow-500 text-black font-black rounded-full w-4 h-4 flex items-center justify-center">⭐</span>
                </button>
              )}

              {/* Switch Camera — Premium Only (mobile) */}
              {isPremium && (
                <button
                  onClick={switchCamera}
                  title="Switch Camera"
                  className="rounded-full p-4 bg-white/20 text-white hover:bg-white/30 transition-all duration-300 shadow-lg flex items-center justify-center"
                >
                  <SwitchCameraIcon className="text-[28px]" />
                </button>
              )}

              <div className="w-px h-10 bg-white/20 hidden sm:block mx-1" />

              <button
                onClick={skip}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white text-black hover:bg-gray-100 rounded-full font-black tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
              >
                <SkipIcon className="text-2xl" />
                <span className="hidden sm:inline">NEXT</span>
              </button>

              <button
                onClick={disconnect}
                className="rounded-full flex items-center justify-center p-4 bg-red-600 hover:bg-red-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              >
                <PhoneOffIcon className="text-[28px]" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Premium tooltip toast */}
      {showPremiumTooltip && (
        <div
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-indigo-500/40 text-white text-sm px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 cursor-pointer"
          onClick={() => setShowPremiumTooltip(false)}
        >
          <PremiumIcon className="text-yellow-400" />
          <span>Upgrade to <a href="/premium" className="text-indigo-400 font-bold hover:underline">Premium</a> for mic & camera controls</span>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
