import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, X } from 'lucide-react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

/**
 * Voice Assistant Component - Futuristic Voice Orb
 */
const VoiceAssistant = () => {
    const { status, error, isConnected, start, stop } = useVoiceAssistant();
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-expand when active
    useEffect(() => {
        if (status !== 'idle') {
            setIsExpanded(true);
        }
    }, [status]);

    const handleToggle = () => {
        if (isConnected) {
            stop();
            setIsExpanded(false);
        } else {
            start();
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'connecting': return 'from-yellow-400 via-orange-400 to-orange-500';
            case 'listening': return 'from-blue-400 via-cyan-400 to-cyan-500';
            case 'speaking': return 'from-purple-400 via-pink-400 to-pink-500';
            case 'error': return 'from-red-400 via-rose-400 to-rose-500';
            default: return 'from-indigo-500 via-purple-500 to-pink-500';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'connecting': return 'Connecting...';
            case 'listening': return 'Listening...';
            case 'speaking': return 'Speaking...';
            case 'error': return 'Error';
            default: return 'Start Voice Chat';
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50">
            {/* Voice Orb Container */}
            <div className={`transition-all duration-500 ${isExpanded ? 'scale-100' : 'scale-90'}`}>
                {/* Error Message */}
                {error && isExpanded && (
                    <div className="absolute bottom-full mb-4 right-0 bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl max-w-xs animate-slide-up border-2 border-red-400">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Status Text */}
                {isExpanded && status !== 'idle' && (
                    <div className="absolute bottom-full mb-4 right-0 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl animate-slide-up border-2 border-gray-700">
                        <p className="text-sm font-bold tracking-wide">{getStatusText()}</p>
                    </div>
                )}

                {/* Main Orb Button */}
                <button
                    onClick={handleToggle}
                    className={`relative group ${isExpanded ? 'w-36 h-36' : 'w-24 h-24'} transition-all duration-500`}
                    aria-label={isConnected ? 'Stop voice assistant' : 'Start voice assistant'}
                >
                    {/* Outer Glow Rings */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getStatusColor()} opacity-40 blur-2xl ${status === 'listening' || status === 'speaking' ? 'animate-pulse' : ''}`} />
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getStatusColor()} opacity-50 blur-xl ${status === 'listening' || status === 'speaking' ? 'animate-ping' : ''}`} />

                    {/* Sound Wave Rings - Animated */}
                    {(status === 'listening' || status === 'speaking') && (
                        <>
                            <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-sound-wave-1" />
                            <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-sound-wave-2" />
                            <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-sound-wave-3" />
                        </>
                    )}

                    {/* Main Orb */}
                    <div className={`relative w-full h-full rounded-full bg-gradient-to-br ${getStatusColor()} shadow-[0_0_60px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-110 border-4 border-white/30`}>
                        {/* Glassmorphism Overlay */}
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />

                        {/* Inner Glow */}
                        <div className="absolute inset-4 rounded-full bg-white/10 blur-md" />

                        {/* Favicon Icon */}
                        <div className="relative z-10 bg-white/90 rounded-full p-3 shadow-xl">
                            <img
                                src="/favicon.ico"
                                alt="VivaBot"
                                className={`${isExpanded ? 'w-16 h-16' : 'w-10 h-10'} transition-all duration-500`}
                            />
                        </div>

                        {/* Status Icon Overlay */}
                        <div className="absolute bottom-3 right-3 z-20">
                            {status === 'listening' && (
                                <div className="bg-blue-600 rounded-full p-2 shadow-2xl animate-pulse border-2 border-white">
                                    <Mic className="w-5 h-5 text-white" />
                                </div>
                            )}
                            {status === 'speaking' && (
                                <div className="bg-purple-600 rounded-full p-2 shadow-2xl animate-pulse border-2 border-white">
                                    <Volume2 className="w-5 h-5 text-white" />
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="bg-red-600 rounded-full p-2 shadow-2xl border-2 border-white">
                                    <AlertCircle className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
                    </div>

                    {/* Stop Button (when active) */}
                    {isConnected && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                stop();
                                setIsExpanded(false);
                            }}
                            className="absolute -top-3 -right-3 bg-red-600 rounded-full p-2.5 shadow-2xl hover:bg-red-700 transition-colors z-30 border-2 border-white"
                            aria-label="Stop conversation"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    )}
                </button>

                {/* Label (when collapsed) */}
                {!isExpanded && status === 'idle' && (
                    <div className="absolute -top-14 right-0 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl border-2 border-gray-700">
                        Talk to VivaBot 🎤
                    </div>
                )}
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes sound-wave-1 {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.3); opacity: 0; }
                }
                @keyframes sound-wave-2 {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes sound-wave-3 {
                    0%, 100% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.7); opacity: 0; }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-sound-wave-1 {
                    animation: sound-wave-1 1.5s ease-in-out infinite;
                }
                .animate-sound-wave-2 {
                    animation: sound-wave-2 1.5s ease-in-out infinite 0.2s;
                }
                .animate-sound-wave-3 {
                    animation: sound-wave-3 1.5s ease-in-out infinite 0.4s;
                }
                .animate-shimmer {
                    animation: shimmer 2.5s ease-in-out infinite;
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default VoiceAssistant;
