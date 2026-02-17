import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, ArrowLeft, Search, ChevronDown, Languages, X, Globe, Zap, Shield } from 'lucide-react';
import { useLinguaLive, LANGUAGES } from '../hooks/useLinguaLive';
import './LinguaLive.css';

const PHASE = { SELECT: 'select', SESSION: 'session' };

// ─── Canvas Visualizer
function Visualizer({ audioLevel, status, isConnected, isHolding }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const tRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            w = canvas.offsetWidth;
            h = canvas.offsetHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        const draw = () => {
            tRef.current += 0.012;
            const t = tRef.current;
            const cx = w / 2;
            const cy = h / 2;
            const level = isConnected ? audioLevel : 0;

            ctx.clearRect(0, 0, w, h);

            // Ambient glow
            const ambR = Math.min(w, h) * 0.35;
            const amb = ctx.createRadialGradient(cx, cy, 0, cx, cy, ambR + level * 80);
            if (status === 'speaking') {
                amb.addColorStop(0, `rgba(168, 85, 247, ${0.06 + level * 0.12})`);
                amb.addColorStop(0.5, `rgba(124, 58, 237, ${0.03 + level * 0.06})`);
                amb.addColorStop(1, 'transparent');
            } else if (isHolding) {
                amb.addColorStop(0, `rgba(6, 182, 212, ${0.08 + level * 0.15})`);
                amb.addColorStop(0.5, `rgba(6, 182, 212, ${0.03 + level * 0.06})`);
                amb.addColorStop(1, 'transparent');
            } else {
                amb.addColorStop(0, 'rgba(124, 58, 237, 0.04)');
                amb.addColorStop(1, 'transparent');
            }
            ctx.fillStyle = amb;
            ctx.fillRect(0, 0, w, h);

            // Concentric rings
            const rings = 3;
            for (let r = 0; r < rings; r++) {
                const baseR = ambR * 0.4 + r * 28;
                const wave = isConnected ? Math.sin(t * 2 + r * 1.2) * level * 12 : Math.sin(t + r) * 2;
                const radius = baseR + wave;
                let alpha = 0.06 - r * 0.015;
                if (isHolding) alpha = 0.12 + level * 0.15 - r * 0.03;
                if (status === 'speaking') alpha = 0.1 + level * 0.12 - r * 0.025;

                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.strokeStyle = status === 'speaking'
                    ? `rgba(168, 85, 247, ${alpha})`
                    : isHolding
                        ? `rgba(6, 182, 212, ${alpha})`
                        : `rgba(148, 163, 184, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Frequency arc bars (subtle)
            if (isConnected && (isHolding || status === 'speaking')) {
                const numBars = 48;
                const barBase = ambR * 0.32;
                for (let i = 0; i < numBars; i++) {
                    const angle = (i / numBars) * Math.PI * 2 - Math.PI / 2;
                    const noise = Math.sin(t * 3 + i * 0.4) * 0.4 + Math.cos(t * 2.3 + i * 0.7) * 0.3;
                    const barH = 3 + level * 35 + noise * (8 + level * 15);

                    const x1 = cx + Math.cos(angle) * barBase;
                    const y1 = cy + Math.sin(angle) * barBase;
                    const x2 = cx + Math.cos(angle) * (barBase + barH);
                    const y2 = cy + Math.sin(angle) * (barBase + barH);

                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineWidth = 1.5;

                    const hue = status === 'speaking' ? 270 + (i / numBars) * 50 : 185 + (i / numBars) * 20;
                    ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${0.25 + level * 0.5})`;
                    ctx.stroke();
                }
            }

            animRef.current = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [audioLevel, status, isConnected, isHolding]);

    return <canvas ref={canvasRef} className="ll-canvas" />;
}

// ─── Main Component
export default function LinguaLive() {
    const navigate = useNavigate();
    const {
        status, error, isConnected, audioLevel,
        sessionDuration, isMicMuted, lastUserText, lastModelText,
        start, stop, setMicMuted
    } = useLinguaLive();

    const [phase, setPhase] = useState(PHASE.SELECT);
    const [targetLang, setTargetLang] = useState('hi');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showPermission, setShowPermission] = useState(false);
    const [isHolding, setIsHolding] = useState(false);

    const userScrollRef = useRef(null);
    const modelScrollRef = useRef(null);

    const selectedLang = LANGUAGES.find(l => l.code === targetLang);

    // Auto-scroll transcript containers
    useEffect(() => {
        if (userScrollRef.current) {
            userScrollRef.current.scrollTop = userScrollRef.current.scrollHeight;
        }
    }, [lastUserText]);

    useEffect(() => {
        if (modelScrollRef.current) {
            modelScrollRef.current.scrollTop = modelScrollRef.current.scrollHeight;
        }
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
        if (seen) {
            beginSession();
        } else {
            setShowPermission(true);
        }
    };

    const beginSession = () => {
        setPhase(PHASE.SESSION);
        start(targetLang);
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
        const close = (e) => {
            if (!e.target.closest('.ll-picker')) setIsDropdownOpen(false);
        };
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [isDropdownOpen]);

    return (
        <div className="ll-app">
            {/* ─── SELECT PHASE ─── */}
            {phase === PHASE.SELECT && (
                <div className="ll-select">
                    <div className="ll-select__bg" />

                    {/* Top Bar */}
                    <div className="ll-topbar">
                        <button className="ll-topbar__back" onClick={() => navigate('/')}>
                            <ArrowLeft size={16} />
                            <span>Back</span>
                        </button>
                        <div className="ll-topbar__badge">
                            <div className="ll-topbar__badge-dot" />
                            <span>LIVE TRANSLATION</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="ll-select__content">
                        {/* Brand */}
                        <div className="ll-hero">
                            <div className="ll-hero__icon-wrap">
                                <div className="ll-hero__icon">
                                    <Languages size={24} />
                                </div>
                                <div className="ll-hero__icon-ring" />
                            </div>
                            <h1 className="ll-hero__title">
                                Lingua<span className="ll-hero__accent">Live</span>
                            </h1>
                            <p className="ll-hero__sub">
                                Real-time voice translation powered by AI.
                                <br />Speak naturally — hear it translated instantly.
                            </p>
                        </div>

                        {/* Language Picker */}
                        <div className="ll-picker">
                            <label className="ll-picker__label">Translate my voice to</label>
                            <button
                                className={`ll-picker__trigger ${isDropdownOpen ? 'll-picker__trigger--open' : ''}`}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span className="ll-picker__flag">{selectedLang?.flag}</span>
                                <div className="ll-picker__info">
                                    <span className="ll-picker__name">{selectedLang?.name}</span>
                                    <span className="ll-picker__native">{selectedLang?.native}</span>
                                </div>
                                <ChevronDown size={18} className={`ll-picker__arrow ${isDropdownOpen ? 'll-picker__arrow--up' : ''}`} />
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
                                                <span className="ll-dd__native">{lang.native}</span>
                                                {lang.code === targetLang && <span className="ll-dd__check">✓</span>}
                                            </button>
                                        ))}
                                        {filtered.length === 0 && (
                                            <div className="ll-dd__empty">No languages found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Start */}
                        <button className="ll-start" onClick={handleStart}>
                            <div className="ll-start__shimmer" />
                            <Mic size={18} />
                            <span>Start Translating</span>
                        </button>

                        {/* Features */}
                        <div className="ll-features">
                            <div className="ll-feat">
                                <Zap size={14} />
                                <span>Low latency</span>
                            </div>
                            <div className="ll-feat">
                                <Globe size={14} />
                                <span>40+ languages</span>
                            </div>
                            <div className="ll-feat">
                                <Shield size={14} />
                                <span>Private & secure</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── SESSION PHASE ─── */}
            {phase === PHASE.SESSION && (
                <div className="ll-session">
                    <Visualizer
                        audioLevel={audioLevel}
                        status={status}
                        isConnected={isConnected}
                        isHolding={isHolding}
                    />

                    {/* Top */}
                    <div className="ll-session__top">
                        <button className="ll-session__close" onClick={handleEndSession}>
                            <X size={16} />
                        </button>
                        <div className="ll-session__meta">
                            <span className="ll-session__lang-tag">
                                {selectedLang?.flag} {selectedLang?.name}
                            </span>
                        </div>
                        <div className="ll-session__timer">
                            <div className="ll-session__timer-dot" />
                            {formatDuration(sessionDuration)}
                        </div>
                    </div>

                    {/* Center */}
                    <div className="ll-session__center">
                        <div className={`ll-status-orb ll-status-orb--${status} ${isHolding ? 'll-status-orb--holding' : ''}`}
                            style={{ '--level': isConnected ? audioLevel : 0 }}
                        >
                            <div className="ll-status-orb__pulse" />
                            <div className="ll-status-orb__core">
                                {status === 'connecting' && <div className="ll-spinner" />}
                                {status === 'speaking' && (
                                    <div className="ll-bars">
                                        <span /><span /><span /><span /><span />
                                    </div>
                                )}
                                {(status === 'listening' || status === 'idle') && (
                                    isHolding ? <Mic size={30} /> : <MicOff size={30} />
                                )}
                                {status === 'error' && <MicOff size={30} />}
                            </div>
                        </div>
                        <p className="ll-status-text">
                            {status === 'connecting' && 'Connecting...'}
                            {status === 'listening' && !isHolding && 'Ready — hold to speak'}
                            {status === 'listening' && isHolding && 'Listening...'}
                            {status === 'speaking' && 'Translating...'}
                            {status === 'error' && (error || 'Connection error')}
                            {status === 'idle' && 'Ready'}
                        </p>
                    </div>

                    {/* Live Transcript */}
                    {isConnected && (lastUserText || lastModelText) && (
                        <div className="ll-transcript">
                            {lastUserText && (
                                <div className="ll-transcript__block ll-transcript__block--user">
                                    <span className="ll-transcript__label">🎙 You</span>
                                    <div className="ll-transcript__text" ref={userScrollRef}>
                                        {lastUserText}
                                    </div>
                                </div>
                            )}
                            {lastModelText && (
                                <div className="ll-transcript__block ll-transcript__block--model">
                                    <span className="ll-transcript__label">🌐 Translation</span>
                                    <div className="ll-transcript__text" ref={modelScrollRef}>
                                        {lastModelText}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bottom PTT */}
                    {isConnected && (
                        <div className="ll-ptt-wrap">
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
                                {isHolding && (
                                    <div className="ll-ptt__rings">
                                        <span /><span /><span />
                                    </div>
                                )}
                                <div className="ll-ptt__inner">
                                    <Mic size={24} />
                                </div>
                            </button>
                            <span className="ll-ptt__hint">
                                {isHolding ? 'Release to stop' : 'Hold to speak'}
                            </span>
                        </div>
                    )}

                    {!isConnected && status === 'connecting' && (
                        <div className="ll-ptt-wrap">
                            <p className="ll-wait">Setting up interpreter...</p>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Permission Modal ─── */}
            {showPermission && (
                <div className="ll-modal-bg" onClick={() => setShowPermission(false)}>
                    <div className="ll-modal" onClick={e => e.stopPropagation()}>
                        <div className="ll-modal__icon"><Mic size={24} /></div>
                        <h3 className="ll-modal__title">Microphone Access</h3>
                        <p className="ll-modal__desc">
                            We need your microphone to capture speech for real-time translation. Audio is processed live and never stored.
                        </p>
                        <div className="ll-modal__btns">
                            <button className="ll-modal__btn ll-modal__btn--ghost" onClick={() => setShowPermission(false)}>Cancel</button>
                            <button className="ll-modal__btn ll-modal__btn--primary" onClick={handlePermissionAccept}>Allow Access</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
