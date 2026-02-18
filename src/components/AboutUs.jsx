import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';

function AboutUs() {
    const sectionRefs = useRef([]);

    useEffect(() => {
        window.scrollTo(0, 0);

        // Intersection Observer for scroll-triggered animations
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('about__visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
        );

        sectionRefs.current.forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const addRef = (el) => {
        if (el && !sectionRefs.current.includes(el)) {
            sectionRefs.current.push(el);
        }
    };

    return (
        <div className="about-page">
            {/* ═══════ HERO BANNER ═══════ */}
            <section className="about-hero">
                <div className="about-hero__noise" />
                <div className="about-hero__glow about-hero__glow--1" />
                <div className="about-hero__glow about-hero__glow--2" />
                <div className="about-hero__content">
                    <span className="about-hero__eyebrow">About Us</span>
                    <h1 className="about-hero__title">
                        Building the Future of
                        <span className="about-hero__title-accent"> Voice AI</span>
                    </h1>
                    <p className="about-hero__subtitle">
                        We're on a mission to make AI voice technology accessible, intelligent, and human-centered for businesses worldwide.
                    </p>
                </div>
                <div className="about-hero__scroll-indicator">
                    <div className="about-hero__scroll-line" />
                </div>
            </section>

            {/* ═══════ MISSION & VISION ═══════ */}
            <section className="about-mission" ref={addRef}>
                <div className="about-mission__grid">
                    <div className="about-mission__card about-mission__card--mission">
                        <div className="about-mission__card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="6" />
                                <circle cx="12" cy="12" r="2" />
                            </svg>
                        </div>
                        <h3 className="about-mission__card-title">Our Mission</h3>
                        <p className="about-mission__card-text">
                            To democratize AI-powered voice technology, enabling businesses of every size to deliver exceptional, human-like conversational experiences that scale effortlessly — 24/7.
                        </p>
                    </div>
                    <div className="about-mission__card about-mission__card--vision">
                        <div className="about-mission__card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <h3 className="about-mission__card-title">Our Vision</h3>
                        <p className="about-mission__card-text">
                            A world where language is never a barrier — where intelligent voice agents empower seamless communication, bridging cultures, industries, and people through cutting-edge AI.
                        </p>
                    </div>
                    <div className="about-mission__card about-mission__card--values">
                        <div className="about-mission__card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </div>
                        <h3 className="about-mission__card-title">Our Values</h3>
                        <p className="about-mission__card-text">
                            Innovation without compromise. We believe in building ethically, shipping fast, and putting user experience above everything else. Every voice matters.
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══════ FOUNDER SECTION ═══════ */}
            <section className="about-founder" ref={addRef}>
                <div className="about-founder__label">
                    <span className="about-founder__label-line" />
                    <span className="about-founder__label-text">Meet the Founder</span>
                    <span className="about-founder__label-line" />
                </div>

                <div className="about-founder__card">
                    {/* Decorative elements */}
                    <div className="about-founder__card-glow" />
                    <div className="about-founder__card-border" />

                    <div className="about-founder__card-inner">
                        {/* Avatar */}
                        <div className="about-founder__avatar-wrapper">
                            <div className="about-founder__avatar-ring" />
                            <div className="about-founder__avatar">
                                <span className="about-founder__avatar-initials">YN</span>
                            </div>
                            <div className="about-founder__avatar-status">
                                <span className="about-founder__avatar-status-dot" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="about-founder__info">
                            <h2 className="about-founder__name">Yash Nagar</h2>
                            <p className="about-founder__role">Founder & CEO</p>
                            <div className="about-founder__divider" />
                            <p className="about-founder__bio">
                                A passionate technologist and entrepreneur with a deep love for AI, voice technology, and building products that make a real difference. Yash founded VivaBot Technologies with a vision to transform how businesses interact with their customers through intelligent voice agents.
                            </p>
                            <p className="about-founder__bio about-founder__bio--secondary">
                                With expertise spanning AI/ML, full-stack development, and product design, Yash is driven by the belief that the future of human-computer interaction lies in natural, voice-first experiences. When he's not coding, you'll find him exploring the latest in AI research and building the next generation of conversational technology.
                            </p>

                            {/* Social Links */}
                            <div className="about-founder__socials">
                                <a
                                    href="https://linkedin.com/in/yash-nagar-a7484827b/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="about-founder__social-link"
                                    aria-label="LinkedIn"
                                    id="founder-linkedin"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://instagram.com/yashnagar_vb/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="about-founder__social-link"
                                    aria-label="Instagram"
                                    id="founder-instagram"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://x.com/Yashnagar_coder"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="about-founder__social-link"
                                    aria-label="X / Twitter"
                                    id="founder-twitter"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://yashnagarkota.in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="about-founder__social-link"
                                    aria-label="Portfolio"
                                    id="founder-portfolio"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M2 12h20" />
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ STATS / HIGHLIGHTS ═══════ */}
            <section className="about-stats" ref={addRef}>
                <div className="about-stats__grid">
                    <div className="about-stats__item">
                        <span className="about-stats__number">AI</span>
                        <span className="about-stats__label">First Approach</span>
                    </div>
                    <div className="about-stats__divider" />
                    <div className="about-stats__item">
                        <span className="about-stats__number">24/7</span>
                        <span className="about-stats__label">Voice Agents Live</span>
                    </div>
                    <div className="about-stats__divider" />
                    <div className="about-stats__item">
                        <span className="about-stats__number">∞</span>
                        <span className="about-stats__label">Languages Supported</span>
                    </div>
                    <div className="about-stats__divider" />
                    <div className="about-stats__item">
                        <span className="about-stats__number">&lt;1s</span>
                        <span className="about-stats__label">Response Latency</span>
                    </div>
                </div>
            </section>

            {/* ═══════ WHAT WE DO ═══════ */}
            <section className="about-services" ref={addRef}>
                <h2 className="about-services__title">What We Build</h2>
                <p className="about-services__subtitle">
                    Cutting-edge voice AI products that transform customer experiences
                </p>
                <div className="about-services__grid">
                    <div className="about-services__card">
                        <div className="about-services__card-number">01</div>
                        <h3 className="about-services__card-title">AI Voice Agents</h3>
                        <p className="about-services__card-text">
                            Custom-built intelligent voice agents that handle customer calls, qualify leads, and provide support with human-like natural conversations.
                        </p>
                    </div>
                    <div className="about-services__card">
                        <div className="about-services__card-number">02</div>
                        <h3 className="about-services__card-title">LinguaLive Translator</h3>
                        <p className="about-services__card-text">
                            Real-time AI-powered translation that breaks language barriers, enabling seamless multilingual conversations across the globe.
                        </p>
                    </div>
                    <div className="about-services__card">
                        <div className="about-services__card-number">03</div>
                        <h3 className="about-services__card-title">Voice Analytics</h3>
                        <p className="about-services__card-text">
                            Deep conversation intelligence and analytics to help businesses understand sentiment, extract insights, and optimize interactions.
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══════ CTA SECTION ═══════ */}
            <section className="about-cta" ref={addRef}>
                <div className="about-cta__glow" />
                <h2 className="about-cta__title">Ready to Transform Your Business?</h2>
                <p className="about-cta__text">
                    Let's build the voice AI experience your customers deserve.
                </p>
                <div className="about-cta__actions">
                    <Link to="/" className="about-cta__btn about-cta__btn--primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0" />
                            <path d="M3 12h18" />
                            <path d="M12 3c2 2.5 3 5.5 3 9s-1 6.5-3 9" />
                            <path d="M12 3c-2 2.5-3 5.5-3 9s1 6.5 3 9" />
                        </svg>
                        Back to Home
                    </Link>
                    <Link to="/lingualive" className="about-cta__btn about-cta__btn--secondary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" />
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="m4.93 4.93 1.41 1.41" />
                            <path d="m17.66 17.66 1.41 1.41" />
                            <path d="M2 12h2" />
                            <path d="M20 12h2" />
                            <path d="m6.34 17.66-1.41 1.41" />
                            <path d="m19.07 4.93-1.41 1.41" />
                        </svg>
                        Try LinguaLive
                    </Link>
                </div>
            </section>

            {/* ═══════ FOOTER ═══════ */}
            <footer className="about-footer">
                <div className="about-footer__inner">
                    <div className="about-footer__brand">
                        <span className="about-footer__logo-dot" />
                        <span className="about-footer__logo-text">VIVABOT</span>
                    </div>
                    <p className="about-footer__copy">
                        © {new Date().getFullYear()} VivaBot Technologies. All rights reserved.
                    </p>
                    <div className="about-footer__links">
                        <Link to="/" className="about-footer__link">Home</Link>
                        <Link to="/lingualive" className="about-footer__link">LinguaLive</Link>
                        <a href="mailto:hello@vivabot.tech" className="about-footer__link">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default AboutUs;
