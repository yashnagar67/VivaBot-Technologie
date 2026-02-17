import { useEffect } from 'react';
import ReactGA from 'react-ga4';
import SplineScene from './components/SplineScene';
import VoiceAssistant from './components/VoiceAssistant';

const SPLINE_ROBOT_URL = 'https://prod.spline.design/9AxqfcHKT-BLG1bC/scene.splinecode';

function App() {
  useEffect(() => {
    ReactGA.initialize('G-6WQ0EQ20DJ');
    ReactGA.send({ hitType: 'pageview', page: window.location.pathname });

    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  return (
    <>
      {/* ═══════ NAVIGATION ═══════ */}
      <nav className="nav" id="main-nav">
        <div className="nav__logo">
          <span className="nav__logo-dot" />
          VIVABOT
        </div>

        <ul className="nav__links">
          <li className="nav__link" id="nav-home">Home</li>
          <li className="nav__link" id="nav-testimonials">Testimonials</li>
          <li className="nav__link" id="nav-contact">Contact</li>
        </ul>

        <div className="nav__cta" id="nav-cta-talk">
          <span>// Let's Talk</span>
          <span className="nav__cta-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </span>
        </div>

        <button className="nav__mobile-toggle" id="nav-mobile-toggle" aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="hero" id="hero">
        <div className="hero__noise" />

        {/* 3D Scene — Spline (full viewport) */}
        <div className="hero__3d-container" id="hero-3d-container">
          <SplineScene scene={SPLINE_ROBOT_URL} />
        </div>

        {/* ─── Hero Text ─── */}
        <div className="hero__content">
          <span className="hero__eyebrow">AI-Powered Voice Intelligence</span>
          <h1 className="hero__headline">
            <span className="hero__headline-line">
              <span className="hero__headline-word hero__headline-word--outline">The</span>
              <span className="hero__headline-word hero__headline-word--accent">&nbsp;AI</span>
            </span>
            <span className="hero__headline-line">Voice Agent</span>
            <span className="hero__headline-line">
              <span className="hero__headline-word hero__headline-word--outline">Agency</span>
            </span>
          </h1>
          <p className="hero__subtitle">
            Custom voice AI solutions for businesses that want to scale conversations, automate support, and close deals — 24/7.
          </p>
        </div>
      </section>

      {/* ═══════ TRUSTED-BY BAR ═══════ */}
      <div className="trusted-bar" id="trusted-bar">
        <p className="trusted-bar__label">Trusted by forward-thinking teams</p>
        <div className="trusted-bar__logos">
          <div className="trusted-bar__logo-item">
            <svg className="trusted-bar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            <span className="trusted-bar__logo-name">Nexus AI</span>
          </div>
          <div className="trusted-bar__logo-item">
            <svg className="trusted-bar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 12c2-4 4-8 10-8s8 4 10 8" /><path d="M2 12c2 4 4 8 10 8s8-4 10-8" /><circle cx="12" cy="12" r="3" />
            </svg>
            <span className="trusted-bar__logo-name">Syncwave</span>
          </div>
          <div className="trusted-bar__logo-item">
            <svg className="trusted-bar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 22 20 2 20" /><circle cx="12" cy="14" r="3" />
            </svg>
            <span className="trusted-bar__logo-name">Orion Labs</span>
          </div>
          <div className="trusted-bar__logo-item">
            <svg className="trusted-bar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 9l6 6" /><path d="M15 9l-6 6" />
            </svg>
            <span className="trusted-bar__logo-name">Quantum</span>
          </div>
          <div className="trusted-bar__logo-item">
            <svg className="trusted-bar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l10 6v8l-10 6L2 16V8l10-6z" /><circle cx="12" cy="12" r="4" />
            </svg>
            <span className="trusted-bar__logo-name">Vertex</span>
          </div>
        </div>
      </div>

      {/* ═══════ VOICE ASSISTANT ORB ═══════ */}
      <VoiceAssistant persona="jenie" position="right" name="Jenie" />
    </>
  );
}

export default App;
