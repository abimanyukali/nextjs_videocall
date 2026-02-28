'use client';

import React, { useEffect, useRef } from 'react';
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
    Autorenew as LoaderIcon
} from '@mui/icons-material';

const VideoCall = () => {
    const {
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
        retryMedia,
    } = useWebRTC();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Sync local video stream
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, isVideoOff]);

    // Sync remote video stream
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, status]);

    return (
        <div className="relative w-full h-[100dvh] bg-black overflow-hidden font-sans text-white">

            {/* --- Remote Video Layer (Background) --- */}
            <div className="absolute inset-0 z-0">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                        <div className="flex flex-col items-center justify-center animate-pulse opacity-70">
                            {status === 'waiting' || status === 'connecting' ? (
                                <LoaderIcon className="animate-spin text-6xl md:text-8xl text-indigo-500/50 mb-6" />
                            ) : (
                                <div className="w-24 md:w-32 aspect-square rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-2xl">
                                    <UserIcon className="text-5xl md:text-7xl text-slate-500" />
                                </div>
                            )}
                            <h2 className="text-lg md:text-2xl font-light tracking-[0.2em] uppercase text-white/50 text-center px-4">
                                {status === 'waiting' ? 'Waiting for someone...' :
                                    status === 'connecting' ? 'Connecting to peer...' :
                                        'Ready to connect'}
                            </h2>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Local Video Layer (Floating Top Right / Bottom Right) --- */}
            {localStream && (
                <div className="absolute z-10 top-6 right-6 md:top-auto md:bottom-8 md:right-8 w-28 md:w-56 lg:w-72 aspect-[3/4] md:aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300">
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
                    <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] uppercase font-bold text-white/80">You</div>
                </div>
            )}

            {/* --- Gradient Overlays for Readability --- */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/30" />

            {/* --- Error Overlay --- */}
            {error && (
                <div className="absolute top-0 left-0 w-full z-50 p-4">
                    <div className="max-w-md mx-auto bg-red-600/90 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-sm font-medium">{error}</span>
                        <button
                            onClick={() => retryMedia()}
                            className="px-4 py-2 bg-white text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors whitespace-nowrap"
                        >
                            Retry Media
                        </button>
                    </div>
                </div>
            )}

            {/* --- Status Indicator Overlay --- */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] ${status === 'paired' ? 'bg-emerald-500 animate-pulse' :
                        status === 'waiting' || status === 'connecting' ? 'bg-amber-500 animate-pulse' :
                            'bg-slate-500'
                    }`} />
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                    {status}
                </span>
            </div>

            {/* --- Floating Bottom Control Bar --- */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-lg">
                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 p-3 md:p-4 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] w-full">
                    {status === 'idle' ? (
                        <button
                            onClick={join}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/30"
                        >
                            <PlayIcon className="text-2xl" />
                            <span>START CALL</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={toggleAudio}
                                className={`rounded-full p-4 transition-all duration-300 shadow-lg flex items-center justify-center ${isAudioMuted
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                {isAudioMuted ? <MicOffIcon className="text-[28px]" /> : <MicIcon className="text-[28px]" />}
                            </button>

                            <button
                                onClick={toggleVideo}
                                className={`rounded-full p-4 transition-all duration-300 shadow-lg flex items-center justify-center ${isVideoOff
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                {isVideoOff ? <VideoOffIcon className="text-[28px]" /> : <VideoIcon className="text-[28px]" />}
                            </button>

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
        </div>
    );
};

export default VideoCall;
