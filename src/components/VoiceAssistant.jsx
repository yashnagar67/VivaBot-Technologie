import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, X } from 'lucide-react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

/**
 * Voice Assistant Component - Futuristic Voice Orb
 * @param {string} persona - 'vivabot' or 'jamie'
 * @param {string} position - 'left' or 'right'
 * @param {string} name - Display name for the bot
 */
const VoiceAssistant = ({ persona = 'vivabot', position = 'right', name = 'VivaBot' }) => {
    const { status, error, isConnected, timeRemaining, start, stop } = useVoiceAssistant(persona);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);

    // Format time remaining as MM:SS
    const formatTime = (seconds) => {
        if (seconds === null) return null;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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
            // Check if user has already granted permission before
            const hasSeenPermissionModal = localStorage.getItem(`${persona}_mic_permission_shown`);

            if (hasSeenPermissionModal) {
                // User has seen modal before, directly start
                start();
            } else {
                // First-time user, show permission explanation modal
                setShowPermissionModal(true);
            }
        }
    };

    const handlePermissionAccept = () => {
        setShowPermissionModal(false);
        // Mark that user has seen the permission modal
        localStorage.setItem(`${persona}_mic_permission_shown`, 'true');
        start();
    };

    const handlePermissionCancel = () => {
        setShowPermissionModal(false);
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
        <div className={`fixed bottom-8 ${position === 'left' ? 'left-8' : 'right-8'} z-50`}>
            {/* Permission Explanation Modal */}
            {showPermissionModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500/50 rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-slide-up">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-purple-600 rounded-full p-3">
                                <Mic className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Microphone Access</h3>
                        </div>

                        <p className="text-gray-300 mb-6 leading-relaxed">
                            VivaBot needs access to your microphone to have a voice conversation with you.
                            Your voice data is processed securely and is never stored.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handlePermissionCancel}
                                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePermissionAccept}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                            >
                                Allow Access
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Voice Orb Container */}
            <div className={`transition-all duration-500 ${isExpanded ? 'scale-100' : 'scale-90'}`}>
                {/* Error Message */}
                {error && isExpanded && (
                    <div className={`absolute bottom-full mb-4 ${position === 'left' ? 'left-0' : 'right-0'} bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl max-w-xs animate-slide-up border-2 border-red-400`}>
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Status Text */}
                {isExpanded && status !== 'idle' && (
                    <div className={`absolute bottom-full mb-4 ${position === 'left' ? 'left-0' : 'right-0'} bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl animate-slide-up border-2 border-gray-700`}>
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
                    <div className={`absolute -top-14 ${position === 'left' ? 'left-0' : 'right-0'} bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl border-2 border-gray-700`}>
                        Talk to {name} 🎤
                    </div>
                )}

                {/* Bot Name Label */}
                <div className="text-center mt-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${persona === 'jamie' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                        {name}
                    </span>
                </div>
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
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
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
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default VoiceAssistant;
