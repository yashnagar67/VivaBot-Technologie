import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, ArrowLeft, Search, ChevronDown, X, Volume2 } from 'lucide-react';
import { useLinguaLive, LANGUAGES, VOICES } from '../hooks/useLinguaLive';
import './LinguaLive.css';

const PHASE = { SELECT: 'select', SESSION: 'session' };

// ─── Decorative Orb (Sarvam-style warm gradient with pattern)
function OrbVisualizer({ audioLevel, status, isHolding, isConnected }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const tRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = canvas.offsetWidth;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const draw = () => {
            tRef.current += 0.015;
            const t = tRef.current;
            const cx = size / 2;
            const cy = size / 2;
            const level = isConnected ? audioLevel : 0;
            const baseR = size * 0.35;

            ctx.clearRect(0, 0, size, size);

            // Outer glow
            const glowR = baseR + 30 + level * 40;
            const glow = ctx.createRadialGradient(cx, cy, baseR * 0.5, cx, cy, glowR);
            glow.addColorStop(0, `rgba(251, 146, 60, ${0.08 + level * 0.12})`);
            glow.addColorStop(0.6, `rgba(251, 146, 60, ${0.03 + level * 0.04})`);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
            ctx.fill();

            // Main orb gradient
            const orbR = baseR + level * 12;
            const orbG = ctx.createRadialGradient(cx - orbR * 0.2, cy - orbR * 0.3, 0, cx, cy, orbR);
            if (status === 'speaking') {
                orbG.addColorStop(0, '#fbbf24');
                orbG.addColorStop(0.4, '#f97316');
                orbG.addColorStop(1, '#ea580c');
            } else if (isHolding) {
                orbG.addColorStop(0, '#fdba74');
                orbG.addColorStop(0.4, '#fb923c');
                orbG.addColorStop(1, '#f97316');
            } else {
                orbG.addColorStop(0, '#fed7aa');
                orbG.addColorStop(0.4, '#fdba74');
                orbG.addColorStop(1, '#fb923c');
            }

            ctx.beginPath();
            ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
            ctx.fillStyle = orbG;
            ctx.fill();

            // White decorative swirls (Sarvam-style)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(t * 0.3);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + level * 0.3})`;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';

            const numSwirls = 6;
            for (let i = 0; i < numSwirls; i++) {
                const angle = (i / numSwirls) * Math.PI * 2;
                ctx.save();
                ctx.rotate(angle);
                ctx.beginPath();
                const swirlR = orbR * 0.3 + Math.sin(t * 2 + i) * 4;
                for (let j = 0; j <= 30; j++) {
                    const jt = j / 30;
                    const r = swirlR * jt;
                    const a = jt * Math.PI * 1.5 + Math.sin(t + i * 0.5) * 0.3;
                    const x = Math.cos(a) * r;
                    const y = Math.sin(a) * r;
                    if (j === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.restore();
            }

            // Center dot pattern
            for (let i = 0; i < 5; i++) {
                const dotAngle = (i / 5) * Math.PI * 2 + t * 0.5;
                const dotR = orbR * 0.15;
                const dx = Math.cos(dotAngle) * dotR;
                const dy = Math.sin(dotAngle) * dotR;
                ctx.beginPath();
                ctx.arc(dx, dy, 2 + level * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + level * 0.3})`;
                ctx.fill();
            }

            ctx.restore();

            // Pulsing ring when active
            if (isHolding || status === 'speaking') {
                const pulseR = orbR + 8 + Math.sin(t * 3) * 4 + level * 15;
                ctx.beginPath();
                ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(251, 146, 60, ${0.2 + level * 0.3})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            animRef.current = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [audioLevel, status, isHolding, isConnected]);

    return <canvas ref={canvasRef} className="ll-orb-canvas" />;
}

// ─── Main Component
export default function LinguaLive() {
    const navigate = useNavigate();
    const {
        status, error, isConnected, audioLevel,
        sessionDuration, isMicMuted, lastUserText, lastModelText,
        previewingVoice, connectionQuality,
        start, stop, setMicMuted, previewVoice
    } = useLinguaLive();

    const [phase, setPhase] = useState(PHASE.SELECT);
    const [targetLang, setTargetLang] = useState('hi');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showPermission, setShowPermission] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState('Kore');

    const userScrollRef = useRef(null);
    const modelScrollRef = useRef(null);

    const selectedLang = LANGUAGES.find(l => l.code === targetLang);

    // Auto-scroll transcripts
    useEffect(() => {
        if (userScrollRef.current) userScrollRef.current.scrollTop = userScrollRef.current.scrollHeight;
    }, [lastUserText]);
    useEffect(() => {
        if (modelScrollRef.current) modelScrollRef.current.scrollTop = modelScrollRef.current.scrollHeight;
    }, [lastModelText]);

    const filtered = useMemo(() => {
        if (!searchQuery) return LANGUAGES;
        const q = searchQuery.toLowerCase();
        return LANGUAGES.filter(l =>
            l.name.toLowerCase().includes(q) ||
            l.native.toLowerCase().includes(q) ||
            l.code.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const formatDuration = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        const seen = localStorage.getItem('lingualive_mic_permission_shown');
        seen ? beginSession() : setShowPermission(true);
    };

    const beginSession = () => {
        setPhase(PHASE.SESSION);
        start(targetLang, selectedVoice);
    };

    const handlePermissionAccept = () => {
        setShowPermission(false);
        localStorage.setItem('lingualive_mic_permission_shown', 'true');
        beginSession();
    };

    const handleEndSession = () => {
        stop();
        setPhase(PHASE.SELECT);
    };

    const handleHoldStart = useCallback(() => {
        if (!isConnected) return;
        setIsHolding(true);
        setMicMuted(false);
    }, [isConnected, setMicMuted]);

    const handleHoldEnd = useCallback(() => {
        setIsHolding(false);
        setMicMuted(true);
    }, [setMicMuted]);

    useEffect(() => {
        if (!isDropdownOpen) return;
        const close = (e) => { if (!e.target.closest('.ll-picker')) setIsDropdownOpen(false); };
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [isDropdownOpen]);

    return (
        <div className="ll-app">
            {/* ═══ SELECT PHASE ═══ */}
            {phase === PHASE.SELECT && (
                <div className="ll-select">
                    {/* Warm gradient bg */}
                    <div className="ll-select__gradient" />

                    {/* Header */}
                    <header className="ll-header">
                        <button className="ll-header__back" onClick={() => navigate('/')}>
                            <ArrowLeft size={18} />
                        </button>
                        <span className="ll-header__brand">LinguaLive</span>
                    </header>

                    {/* Main content */}
                    <main className="ll-select__main">
                        {/* Hero text */}
                        <div className="ll-hero">
                            <span className="ll-hero__badge">Real-time Voice Translation</span>
                            <h1 className="ll-hero__title">
                                Speak in any language.
                                <br />Hear it <em>translated</em>.
                            </h1>
                            <p className="ll-hero__desc">
                                Just hold and talk — AI translates your voice instantly into the language you choose.
                            </p>
                        </div>

                        {/* Language Card */}
                        <div className="ll-card">
                            <div className="ll-picker">
                                <label className="ll-picker__label">Language</label>
                                <button
                                    className={`ll-picker__trigger ${isDropdownOpen ? 'll-picker__trigger--open' : ''}`}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <span className="ll-picker__flag">{selectedLang?.flag}</span>
                                    <div className="ll-picker__text">
                                        <span className="ll-picker__name">{selectedLang?.name}</span>
                                        <span className="ll-picker__native">{selectedLang?.native}</span>
                                    </div>
                                    <ChevronDown size={18} className={`ll-picker__chevron ${isDropdownOpen ? 'll-picker__chevron--up' : ''}`} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="ll-dd">
                                        <div className="ll-dd__search">
                                            <Search size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search languages..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="ll-dd__list">
                                            {filtered.map(lang => (
                                                <button
                                                    key={lang.code}
                                                    className={`ll-dd__item ${lang.code === targetLang ? 'll-dd__item--active' : ''}`}
                                                    onClick={() => { setTargetLang(lang.code); setIsDropdownOpen(false); setSearchQuery(''); }}
                                                >
                                                    <span className="ll-dd__flag">{lang.flag}</span>
                                                    <span className="ll-dd__name">{lang.name}</span>
                                                    <span className="ll-dd__native-text">{lang.native}</span>
                                                    {lang.code === targetLang && <span className="ll-dd__check">✓</span>}
                                                </button>
                                            ))}
                                            {filtered.length === 0 && <div className="ll-dd__empty">No languages found</div>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Voice Picker */}
                            <div className="ll-voice-picker">
                                <label className="ll-picker__label">Voice</label>
                                <div className="ll-voice-chips">
                                    {VOICES.map(v => (
                                        <button
                                            key={v.id}
                                            className={`ll-voice-chip ${v.id === selectedVoice ? 'll-voice-chip--active' : ''}`}
                                            onClick={() => setSelectedVoice(v.id)}
                                        >
                                            <span className="ll-voice-chip__gender">{v.gender === 'F' ? '♀' : '♂'}</span>
                                            <span className="ll-voice-chip__name">{v.label}</span>
                                            <span className="ll-voice-chip__desc">{v.desc}</span>
                                            <span
                                                className={`ll-voice-chip__play ${previewingVoice === v.id ? 'll-voice-chip__play--loading' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); previewVoice(v.id); }}
                                                title="Preview voice"
                                            >
                                                {previewingVoice === v.id ? (
                                                    <span className="ll-voice-chip__spinner" />
                                                ) : (
                                                    <Volume2 size={12} />
                                                )}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="ll-go" onClick={handleStart}>
                                <Mic size={18} />
                                <span>Start Speaking</span>
                            </button>
                        </div>
                    </main>
                </div>
            )}

            {/* ═══ SESSION PHASE ═══ */}
            {phase === PHASE.SESSION && (
                <div className="ll-session">
                    <div className="ll-session__gradient" />

                    {/* Session header */}
                    <header className="ll-session__top">
                        <button className="ll-session__close" onClick={handleEndSession}>
                            <X size={16} />
                            <span>End</span>
                        </button>
                        <div className="ll-session__info">
                            <span className="ll-session__lang">{selectedLang?.flag} {selectedLang?.name}</span>
                            <span className="ll-session__timer">
                                <span className={`ll-session__signal ll-session__signal--${connectionQuality}`}
                                    title={connectionQuality === 'good' ? 'Connected' : connectionQuality === 'reconnecting' ? 'Reconnecting...' : 'Offline'} />
                                {formatDuration(sessionDuration)}
                            </span>
                        </div>
                    </header>

                    {/* Orb + Status */}
                    <div className="ll-session__orb-area">
                        <div className="ll-orb-wrap">
                            <OrbVisualizer
                                audioLevel={audioLevel}
                                status={status}
                                isHolding={isHolding}
                                isConnected={isConnected}
                            />
                            {/* Center icon overlay */}
                            <div className="ll-orb-icon">
                                {status === 'connecting' && <div className="ll-orb-spinner" />}
                                {status === 'speaking' && (
                                    <div className="ll-orb-bars">
                                        <span /><span /><span /><span /><span />
                                    </div>
                                )}
                                {(status === 'listening' || status === 'idle') && (
                                    isHolding ? <Mic size={28} color="#fff" /> : <MicOff size={28} color="rgba(255,255,255,0.6)" />
                                )}
                                {status === 'error' && <MicOff size={28} color="#fff" />}
                            </div>
                        </div>
                        <p className="ll-session__status">
                            {status === 'connecting' && 'Connecting...'}
                            {status === 'listening' && !isHolding && 'Ready'}
                            {status === 'listening' && isHolding && 'Listening...'}
                            {status === 'speaking' && 'Translating...'}
                            {status === 'error' && (error || 'Error')}
                            {status === 'idle' && 'Ready'}
                        </p>
                    </div>

                    {/* Live Transcript */}
                    {isConnected && (lastUserText || lastModelText) && (
                        <div className="ll-live-text">
                            {lastUserText && (
                                <div className="ll-live-text__block ll-live-text__block--you">
                                    <span className="ll-live-text__label">You said</span>
                                    <div className="ll-live-text__content" ref={userScrollRef}>{lastUserText}</div>
                                </div>
                            )}
                            {lastModelText && (
                                <div className="ll-live-text__block ll-live-text__block--ai">
                                    <span className="ll-live-text__label">Translation</span>
                                    <div className="ll-live-text__content" ref={modelScrollRef}>{lastModelText}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PTT Button */}
                    {isConnected && (
                        <div className="ll-ptt-area">
                            <button
                                className={`ll-ptt ${isHolding ? 'll-ptt--active' : ''}`}
                                onMouseDown={handleHoldStart}
                                onMouseUp={handleHoldEnd}
                                onMouseLeave={handleHoldEnd}
                                onTouchStart={(e) => { e.preventDefault(); handleHoldStart(); }}
                                onTouchEnd={(e) => { e.preventDefault(); handleHoldEnd(); }}
                                onTouchCancel={handleHoldEnd}
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <Mic size={22} />
                                <span>{isHolding ? 'Listening...' : 'Hold to Speak'}</span>
                            </button>
                        </div>
                    )}

                    {!isConnected && status === 'connecting' && (
                        <div className="ll-ptt-area">
                            <p className="ll-wait-text">Setting up interpreter...</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ Permission Modal ═══ */}
            {showPermission && (
                <div className="ll-modal-bg" onClick={() => setShowPermission(false)}>
                    <div className="ll-modal" onClick={e => e.stopPropagation()}>
                        <div className="ll-modal__icon"><Mic size={22} /></div>
                        <h3 className="ll-modal__title">Microphone Access</h3>
                        <p className="ll-modal__desc">
                            LinguaLive needs your microphone for voice translation. Audio is processed live and never stored.
                        </p>
                        <div className="ll-modal__btns">
                            <button className="ll-modal__btn ll-modal__btn--cancel" onClick={() => setShowPermission(false)}>Cancel</button>
                            <button className="ll-modal__btn ll-modal__btn--allow" onClick={handlePermissionAccept}>Allow</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
