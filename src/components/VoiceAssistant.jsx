import React, { useState, useEffect } from 'react';
import { Mic, Volume2, AlertCircle, X } from 'lucide-react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

/**
 * Voice Assistant Component - Original Orb Design
 * Desktop: Dark gradient orb with shimmer + sound waves
 * Mobile: Warm-themed orb matching Sarvam-style design
 */
const VoiceAssistant = ({ persona = 'jenie', position = 'right', name = 'Jenie' }) => {
    const { status, error, isConnected, start, stop } = useVoiceAssistant(persona);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);

    useEffect(() => {
        if (status !== 'idle') setIsExpanded(true);
    }, [status]);

    const handleToggle = () => {
        if (isConnected) {
            stop();
            setIsExpanded(false);
        } else {
            const seen = localStorage.getItem(`${persona}_mic_permission_shown`);
            if (seen) start();
            else setShowPermissionModal(true);
        }
    };

    const handlePermissionAccept = () => {
        setShowPermissionModal(false);
        localStorage.setItem(`${persona}_mic_permission_shown`, 'true');
        start();
    };

    const getStatusColor = () => {
        switch (status) {
            case 'connecting': return 'var(--orb-connecting)';
            case 'listening': return 'var(--orb-listening)';
            case 'speaking': return 'var(--orb-speaking)';
            case 'error': return 'var(--orb-error)';
            default: return 'var(--orb-idle)';
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

    const isActive = status === 'listening' || status === 'speaking';

    return (
        <div className="va-container" style={{ [position === 'left' ? 'left' : 'right']: 32 }}>
            {/* Permission Modal */}
            {showPermissionModal && (
                <div className="va-permission-overlay" onClick={() => setShowPermissionModal(false)}>
                    <div className="va-permission-modal va-anim-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="va-permission-header">
                            <div className="va-permission-icon-wrap">
                                <Mic size={24} />
                            </div>
                            <h3 className="va-permission-title">Microphone Access</h3>
                        </div>
                        <p className="va-permission-text">
                            {name} needs access to your microphone to have a voice conversation with you.
                            Your voice data is processed securely and is never stored.
                        </p>
                        <div className="va-permission-actions">
                            <button className="va-permission-btn va-permission-btn--cancel" onClick={() => setShowPermissionModal(false)}>Cancel</button>
                            <button className="va-permission-btn va-permission-btn--allow" onClick={handlePermissionAccept}>Allow Access</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Voice Orb Container */}
            <div className={`va-orb-wrapper ${isExpanded ? 'va-orb-wrapper--expanded' : ''}`}>
                {/* Error Message */}
                {error && isExpanded && (
                    <div className={`va-bubble va-bubble--error va-anim-slide-up va-bubble--${position}`}>
                        <AlertCircle size={16} />
                        <p className="va-bubble__text">{error}</p>
                    </div>
                )}

                {/* Status Text */}
                {isExpanded && status !== 'idle' && (
                    <div className={`va-bubble va-bubble--status va-anim-slide-up va-bubble--${position}`}>
                        <p className="va-bubble__text">{getStatusText()}</p>
                    </div>
                )}

                {/* Main Orb Button */}
                <button className={`va-orb-btn ${isExpanded ? 'va-orb-btn--expanded' : ''}`} onClick={handleToggle} aria-label={isConnected ? 'Stop voice assistant' : 'Start voice assistant'}>
                    {/* Outer Glow */}
                    <div className={`va-glow ${isActive ? 'va-glow--pulse' : ''}`} style={{ background: getStatusColor() }} />
                    <div className={`va-glow va-glow--inner ${isActive ? 'va-glow--ping' : ''}`} style={{ background: getStatusColor() }} />

                    {/* Sound Wave Rings */}
                    {isActive && (
                        <>
                            <div className="va-wave va-wave--1" />
                            <div className="va-wave va-wave--2" />
                            <div className="va-wave va-wave--3" />
                        </>
                    )}

                    {/* Main Orb */}
                    <div className="va-orb" style={{ background: getStatusColor() }}>
                        {/* Glass overlay */}
                        <div className="va-orb__glass" />

                        {/* Inner glow */}
                        <div className="va-orb__inner-glow" />

                        {/* Favicon Icon */}
                        <div className={`va-orb__icon-wrap ${isExpanded ? 'va-orb__icon-wrap--big' : ''}`}>
                            <img src="/favicon.ico" alt={name} className={`va-orb__favicon ${isExpanded ? 'va-orb__favicon--big' : ''}`} />
                        </div>

                        {/* Status Icon Overlay */}
                        <div className="va-orb__status-icon">
                            {status === 'listening' && (
                                <div className="va-status-badge va-status-badge--listening">
                                    <Mic size={16} />
                                </div>
                            )}
                            {status === 'speaking' && (
                                <div className="va-status-badge va-status-badge--speaking">
                                    <Volume2 size={16} />
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="va-status-badge va-status-badge--error">
                                    <AlertCircle size={16} />
                                </div>
                            )}
                        </div>

                        {/* Shimmer */}
                        <div className="va-orb__shimmer" />
                    </div>

                    {/* Stop Button */}
                    {isConnected && (
                        <button
                            className="va-stop-btn"
                            onClick={(e) => { e.stopPropagation(); stop(); setIsExpanded(false); }}
                            aria-label="Stop conversation"
                        >
                            <X size={14} />
                        </button>
                    )}
                </button>

                {/* Bot Name Label */}
                <div className="va-label-wrap">
                    <span className="va-label">{name}</span>
                </div>
            </div>

            <style>{`
                /* ═══════════════════════════════════════════
                   VOICE ASSISTANT ORB — ORIGINAL DESIGN
                   ═══════════════════════════════════════════ */

                :root {
                    --orb-idle: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
                    --orb-connecting: linear-gradient(135deg, #facc15, #f97316, #f97316);
                    --orb-listening: linear-gradient(135deg, #60a5fa, #22d3ee, #06b6d4);
                    --orb-speaking: linear-gradient(135deg, #a855f7, #ec4899, #f472b6);
                    --orb-error: linear-gradient(135deg, #ef4444, #f87171, #ef4444);
                }

                .va-container {
                    position: fixed;
                    bottom: 32px;
                    z-index: 50;
                }

                /* ── Orb Wrapper ── */
                .va-orb-wrapper {
                    transition: all 0.5s cubic-bezier(0.22,1,0.36,1);
                    transform: scale(0.9);
                }
                .va-orb-wrapper--expanded { transform: scale(1); }

                /* ── Main Button ── */
                .va-orb-btn {
                    position: relative;
                    width: 96px;
                    height: 96px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    padding: 0;
                    transition: all 0.5s cubic-bezier(0.22,1,0.36,1);
                }
                .va-orb-btn--expanded { width: 136px; height: 136px; }

                /* ── Glow ── */
                .va-glow {
                    position: absolute; inset: 0;
                    border-radius: 50%; opacity: 0.4; filter: blur(24px);
                }
                .va-glow--inner { opacity: 0.5; filter: blur(16px); }
                .va-glow--pulse { animation: va-glow-pulse 2s ease-in-out infinite; }
                .va-glow--ping { animation: va-glow-ping 1.5s ease-in-out infinite; }

                /* ── Sound Wave Rings ── */
                .va-wave {
                    position: absolute; inset: 0;
                    border-radius: 50%; border: 4px solid rgba(255,255,255,0.5);
                }
                .va-wave--1 { animation: va-sound-wave-1 1.5s ease-in-out infinite; }
                .va-wave--2 { border-color: rgba(255,255,255,0.3); animation: va-sound-wave-2 1.5s ease-in-out infinite 0.2s; }
                .va-wave--3 { border-color: rgba(255,255,255,0.2); animation: va-sound-wave-3 1.5s ease-in-out infinite 0.4s; }

                /* ── Orb ── */
                .va-orb {
                    position: relative; width: 100%; height: 100%;
                    border-radius: 50%; box-shadow: 0 0 60px rgba(0,0,0,0.5);
                    display: flex; align-items: center; justify-content: center;
                    overflow: hidden; transition: all 0.3s;
                    border: 4px solid rgba(255,255,255,0.3);
                }
                .va-orb-btn:hover .va-orb { transform: scale(1.1); }

                .va-orb__glass {
                    position: absolute; inset: 0;
                    background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
                }
                .va-orb__inner-glow {
                    position: absolute; inset: 16px;
                    border-radius: 50%; background: rgba(255,255,255,0.1); filter: blur(8px);
                }

                /* ── Favicon ── */
                .va-orb__icon-wrap {
                    position: relative; z-index: 10;
                    background: rgba(255,255,255,0.9); border-radius: 50%;
                    padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    transition: all 0.5s;
                }
                .va-orb__icon-wrap--big { padding: 14px; }
                .va-orb__favicon { width: 40px; height: 40px; transition: all 0.5s; object-fit: contain; }
                .va-orb__favicon--big { width: 64px; height: 64px; }

                /* ── Status Icon ── */
                .va-orb__status-icon { position: absolute; bottom: 8px; right: 8px; z-index: 20; }
                .va-status-badge {
                    border-radius: 50%; padding: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    border: 2px solid white; color: white;
                    display: flex; align-items: center; justify-content: center;
                    animation: va-badge-pulse 2s ease-in-out infinite;
                }
                .va-status-badge--listening { background: #2563eb; }
                .va-status-badge--speaking { background: #9333ea; }
                .va-status-badge--error { background: #dc2626; animation: none; }

                /* ── Shimmer ── */
                .va-orb__shimmer {
                    position: absolute; inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    transform: translateX(-100%) skewX(-12deg);
                    animation: va-shimmer 2.5s ease-in-out infinite;
                }

                /* ── Stop Button ── */
                .va-stop-btn {
                    position: absolute; top: -6px; right: -6px;
                    width: 28px; height: 28px;
                    background: #dc2626; border-radius: 50%;
                    border: 2px solid white; color: white;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; z-index: 30;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    transition: background 0.2s;
                }
                .va-stop-btn:hover { background: #b91c1c; }

                /* ── Bubbles ── */
                .va-bubble {
                    position: absolute; bottom: 100%; margin-bottom: 16px;
                    padding: 10px 16px; border-radius: 12px;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.3); max-width: 280px; white-space: nowrap;
                }
                .va-bubble--right { right: 0; }
                .va-bubble--left { left: 0; }
                .va-bubble--status { background: #111827; color: white; border: 2px solid #374151; }
                .va-bubble--error {
                    background: #dc2626; color: white; border: 2px solid #f87171;
                    display: flex; align-items: flex-start; gap: 8px;
                }
                .va-bubble__text { font-size: 0.82rem; font-weight: 700; letter-spacing: 0.04em; margin: 0; }

                /* ── Label ── */
                .va-label-wrap { text-align: center; margin-top: 8px; }
                .va-label {
                    display: inline-block; font-family: 'Inter', sans-serif;
                    font-size: 0.7rem; font-weight: 700;
                    padding: 4px 14px; border-radius: 50px;
                    background: #7c3aed; color: white;
                }

                /* ── Permission Modal ── */
                .va-permission-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(8px); display: flex;
                    align-items: center; justify-content: center; z-index: 100;
                    animation: va-fade-in 0.2s ease-out;
                }
                .va-permission-modal {
                    background: linear-gradient(145deg, #111827, #1f2937);
                    border: 2px solid rgba(168,85,247,0.5);
                    border-radius: 16px; padding: 32px;
                    max-width: 400px; margin: 0 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                }
                .va-permission-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
                .va-permission-icon-wrap {
                    background: #7c3aed; border-radius: 50%; padding: 12px;
                    color: white; display: flex; align-items: center; justify-content: center;
                }
                .va-permission-title { font-size: 1.4rem; font-weight: 700; color: white; margin: 0; }
                .va-permission-text { color: #d1d5db; line-height: 1.6; margin-bottom: 24px; font-size: 0.9rem; }
                .va-permission-actions { display: flex; gap: 12px; }
                .va-permission-btn {
                    flex: 1; padding: 12px 24px; border-radius: 12px;
                    font-size: 0.9rem; font-weight: 600; cursor: pointer;
                    border: none; font-family: 'Inter', sans-serif; transition: all 0.2s;
                }
                .va-permission-btn--cancel { background: #374151; color: white; }
                .va-permission-btn--cancel:hover { background: #4b5563; }
                .va-permission-btn--allow {
                    background: linear-gradient(135deg, #7c3aed, #ec4899);
                    color: white; box-shadow: 0 4px 16px rgba(124,58,237,0.3);
                }
                .va-permission-btn--allow:hover { background: linear-gradient(135deg, #6d28d9, #db2777); }

                /* ── Animations ── */
                @keyframes va-sound-wave-1 {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.3); opacity: 0; }
                }
                @keyframes va-sound-wave-2 {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes va-sound-wave-3 {
                    0%, 100% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.7); opacity: 0; }
                }
                @keyframes va-shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }
                @keyframes va-glow-pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.7; }
                }
                @keyframes va-glow-ping {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0; transform: scale(1.2); }
                }
                @keyframes va-badge-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes va-fade-in {
                    from { opacity: 0; } to { opacity: 1; }
                }
                .va-anim-slide-up { animation: va-slide-up 0.3s ease-out; }
                @keyframes va-slide-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ════════════════════════════════════════════
                   MOBILE ORB STYLES — warm theme
                   ════════════════════════════════════════════ */
                @media (max-width: 768px) {
                    :root {
                        --orb-idle: linear-gradient(135deg, #f97316, #f59e0b, #ec4899);
                    }

                    .va-container {
                        bottom: 20px;
                        right: 20px !important;
                    }

                    .va-orb-btn {
                        width: 72px;
                        height: 72px;
                    }
                    .va-orb-btn--expanded {
                        width: 100px;
                        height: 100px;
                    }

                    .va-orb__favicon { width: 32px; height: 32px; }
                    .va-orb__favicon--big { width: 48px; height: 48px; }
                    .va-orb__icon-wrap { padding: 10px; }

                    .va-label {
                        background: #e8732a;
                        font-size: 0.6rem;
                        padding: 3px 10px;
                    }

                    .va-bubble--status {
                        background: rgba(26, 26, 46, 0.9);
                        border: 1px solid rgba(26, 26, 46, 0.2);
                    }

                    .va-permission-modal {
                        background: linear-gradient(145deg, #FFFAF5, #FFF0E0);
                        border: 1px solid rgba(232, 115, 42, 0.3);
                    }
                    .va-permission-title { color: #1a1a2e; }
                    .va-permission-text { color: #5a5a72; }
                    .va-permission-icon-wrap { background: #e8732a; }
                    .va-permission-btn--cancel { background: #f1f5f9; color: #5a5a72; }
                    .va-permission-btn--cancel:hover { background: #e2e8f0; }
                    .va-permission-btn--allow {
                        background: #1a1a2e;
                    }
                    .va-permission-btn--allow:hover {
                        background: #2a2a4e;
                    }
                    .va-permission-overlay {
                        background: rgba(255,250,245,0.7);
                    }
                }
            `}</style>
        </div>
    );
};

export default VoiceAssistant;
