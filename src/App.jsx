import { useEffect, useState, useRef, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import VoiceAssistant from './components/VoiceAssistant';
import LinguaLive from './components/LinguaLive';
import AboutUs from './components/AboutUs';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';

/* ═══════════════════════════════════════
   DEMO PRESETS
   ═══════════════════════════════════════ */
const DEMO_PRESETS = [
  {
    id: 'ecommerce',
    label: 'E-commerce Support',
    prompt: `You are Roopa, a customer support agent at QuickKart, an e-commerce platform for electronics and home appliances.
You handle order tracking, returns, refunds, and product inquiries.
Be warm and solution-oriented. Acknowledge frustration before solving problems.
Keep responses under 3 sentences.
For refunds, explain the 5-7 business day timeline. For replacements, confirm the delivery address before proceeding.
If a customer is angry, apologize sincerely and offer a concrete next step. Never argue or make excuses.
When a customer asks about an order, ask for their order ID if they haven't provided one. Accept any order ID they give and simulate looking it up - create a realistic status like "out for delivery", "shipped", or "processing" based on the conversation context.`
  },
  {
    id: 'realestate',
    label: 'Real Estate Agent',
    prompt: `You are Arjun, a real estate assistant for PrimeHomes Realty.
You help customers find properties, schedule site visits, and answer questions about pricing and locations.
Be professional, enthusiastic, and knowledgeable about real estate trends.
Keep responses under 3 sentences.
Mention popular locations in the customer's city. Ask about their budget, preferred BHK, and move-in timeline.
If they seem interested, offer to schedule a site visit. Create realistic property details when needed.`
  },
  {
    id: 'healthcare',
    label: 'Healthcare Reception',
    prompt: `You are Priya, a receptionist at MedCare Clinic.
You help patients book appointments, check doctor availability, and answer common health-related queries.
Be empathetic, calm, and professional. Prioritize patient concerns.
Keep responses under 3 sentences.
Available doctors: Dr. Sharma (General), Dr. Patel (Ortho), Dr. Gupta (Dermatology). Available slots: 10am-1pm, 3pm-6pm.
For emergencies, always advise calling 108 or visiting the nearest ER immediately.`
  },
  {
    id: 'edtech',
    label: 'Ed-Tech Counselor',
    prompt: `You are Neha, a student counselor at LearnPro Academy.
You help students choose the right courses, explain pricing and schedules, and handle enrollment queries.
Be friendly, encouraging, and student-focused. Use Hinglish naturally.
Keep responses under 3 sentences.
Popular courses: Full Stack Web Dev (₹15,000, 6 months), Data Science (₹20,000, 8 months), Digital Marketing (₹8,000, 3 months).
Next batch starts: 15th of next month. Offer a free demo class to interested students.`
  }
];

const DEMO_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hinglish', name: 'Hinglish' },
];

/* ═══════════════════════════════════════
   LIVE DEMO COMPONENT  
   ═══════════════════════════════════════ */
function LiveDemo() {
  const [selectedPreset, setSelectedPreset] = useState(DEMO_PRESETS[0]);
  const [customPrompt, setCustomPrompt] = useState(DEMO_PRESETS[0].prompt);
  const [selectedLang, setSelectedLang] = useState(DEMO_LANGUAGES[0]);
  const { status, error, isConnected, start, stop } = useVoiceAssistant('custom');

  const handlePresetChange = (presetId) => {
    const preset = DEMO_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(preset);
      setCustomPrompt(preset.prompt);
    }
  };

  const handleStart = () => {
    // Pass the custom prompt + language instruction
    const langInstruction = selectedLang.code === 'hinglish'
      ? '\n\nIMPORTANT: Always respond in Hinglish (natural mix of Hindi and English).'
      : selectedLang.code === 'hi'
        ? '\n\nIMPORTANT: Always respond in Hindi.'
        : '\n\nIMPORTANT: Always respond in English.';
    
    // We'll use the custom prompt via window to pass to the hook
    window.__vivabot_custom_prompt = customPrompt + langInstruction;
    start();
  };

  const isActive = status === 'listening' || status === 'speaking';

  return (
    <section className="demo" id="demo">
      <div className="demo__inner">
        {/* Left: Prompt Editor */}
        <div className="demo__editor">
          <textarea
            className="demo__prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            spellCheck="false"
            rows={10}
          />
          <div className="demo__controls">
            <div className="demo__select-group">
              <select
                className="demo__select"
                value={selectedPreset.id}
                onChange={(e) => handlePresetChange(e.target.value) }
              >
                {DEMO_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="demo__select-group">
              <label className="demo__select-label">Language</label>
              <select
                className="demo__select"
                value={selectedLang.code}
                onChange={(e) => setSelectedLang(DEMO_LANGUAGES.find(l => l.code === e.target.value))}
              >
                {DEMO_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Orb + Start Button */}
        <div className="demo__orb-area">
          <div className={`demo__orb ${isActive ? 'demo__orb--active' : ''} ${status === 'speaking' ? 'demo__orb--speaking' : ''}`}>
            <div className="demo__orb-ring demo__orb-ring--outer" />
            <div className="demo__orb-ring demo__orb-ring--middle" />
            <div className="demo__orb-core">
              {/* Orb icon */}
              <svg className="demo__orb-icon" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="6" fill="rgba(255,255,255,0.9)" />
                <circle cx="30" cy="30" r="14" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
                <path d="M30 16 L30 10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M30 50 L30 44" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 30 L10 30" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M50 30 L44 30" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M20 20 L16 16" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
                <path d="M40 40 L44 44" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
                <path d="M40 20 L44 16" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
                <path d="M20 40 L16 44" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Status text */}
          <p className="demo__status">
            {status === 'connecting' && 'Connecting...'}
            {status === 'listening' && '🎙️ Listening...'}
            {status === 'speaking' && '🔊 Speaking...'}
            {status === 'error' && (error || 'Connection error')}
          </p>

          {/* Start / Stop Button */}
          <button
            className={`demo__start-btn ${isConnected ? 'demo__start-btn--active' : ''}`}
            onClick={isConnected ? stop : handleStart}
          >
            {isConnected ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                Stop
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
                Start Speaking
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════
   HOME PAGE — All sections
   ═══════════════════════════════════════ */
function HomePage() {
  const sectionRefs = useRef([]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
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
    <>
      {/* ═══════ HERO ═══════ */}
      <section className="hero" id="hero">
        <div className="hero__mesh" />
        <div className="hero__grid" />

        <div className="hero__content">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            Rajasthan iStart Recognized Startup
          </div>

          <h1 className="hero__headline">
            AI That Talks to Your{' '}
            <span className="hero__headline-gradient">Customers</span>
            <br />
            So You Don't Have To
          </h1>

          <p className="hero__subtitle">
            Automate calls, qualify leads, and handle customer support 24/7 with AI voice agents
            that sound and feel human. Built for Indian businesses.
          </p>

          <div className="hero__actions">
            <a href="#demo" className="hero__btn hero__btn--primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              Try Live Demo
            </a>
            <Link to="/lingualive" className="hero__btn hero__btn--secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Try Live AI Translator
            </Link>
          </div>

          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-number">&lt;1s</span>
              <span className="hero__stat-label">Response Latency</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-number">40+</span>
              <span className="hero__stat-label">Languages Supported</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-number">24/7</span>
              <span className="hero__stat-label">Always Available</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-number">70%</span>
              <span className="hero__stat-label">Cost Reduction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ LIVE DEMO (right below hero) ═══════ */}
      <LiveDemo />

      {/* ═══════ TRUSTED BY ═══════ */}
      <div className="trusted-bar">
        <div className="trusted-bar__inner">
          <p className="trusted-bar__label">Trusted by forward-thinking businesses</p>
          <div className="trusted-bar__logos">
            {['TechVentures', 'ScaleUp India', 'CloudNine', 'ByteForce', 'NexGen AI'].map((name) => (
              <div className="trusted-bar__logo-item" key={name}>
                <svg className="trusted-bar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
                <span className="trusted-bar__logo-name">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ PROBLEM SECTION ═══════ */}
      <section className="problem fade-up" ref={addRef}>
        <div className="problem__inner">
          <p className="problem__label">The Problem</p>
          <h2 className="problem__title">
            Indian Businesses Lose Crores to Missed Calls & Slow Support
          </h2>
          <p className="problem__subtitle">
            Every unanswered call is a lost customer. Every delayed response pushes leads to your
            competitors. Here's what's really happening:
          </p>

          <div className="problem__grid">
            <div className="problem__card">
              <div className="problem__card-stat">78%</div>
              <h3 className="problem__card-title">Calls Go Unanswered</h3>
              <p className="problem__card-text">
                Most SMBs can't staff enough agents. Peak hours, holidays, after-hours — customers
                hit voicemail and never call back.
              </p>
            </div>
            <div className="problem__card">
              <div className="problem__card-stat">₹2.5L/mo</div>
              <h3 className="problem__card-title">Cost of a 3-Person Team</h3>
              <p className="problem__card-text">
                Salaries, training, attrition — a small support team costs lakhs per month. Most
                startups can't afford it.
              </p>
            </div>
            <div className="problem__card">
              <div className="problem__card-stat">35%</div>
              <h3 className="problem__card-title">Leads Lost to Slow Response</h3>
              <p className="problem__card-text">
                Studies show 35% of leads are lost if not responded to within 5 minutes. Manual
                processes can't keep up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ PRODUCTS (BENTO GRID) ═══════ */}
      <section className="products fade-up" ref={addRef}>
        <div className="products__glow" />
        <div className="products__inner">
          <p className="products__label">Our Products</p>
          <h2 className="products__title">Three AI Products. One Platform.</h2>
          <p className="products__subtitle">
            Everything businesses need to automate conversations, marketing, and support at scale.
          </p>

          <div className="products__bento">
            {/* FEATURED — VivaCaller */}
            <div className="products__card products__card--featured">
              <div>
                <div className="products__card-icon products__card-icon--caller">📞</div>
                <div className="products__card-tag products__card-tag--coming">
                  <span className="products__card-tag-dot" />
                  Coming Soon
                </div>
                <h3 className="products__card-title">VivaCaller — AI Phone Agent</h3>
                <p className="products__card-desc">
                  Your 24/7 AI receptionist that handles inbound and outbound calls, qualifies leads,
                  books appointments, and provides support — all in natural human-like voice.
                </p>
                <div className="products__card-features">
                  <div className="products__card-feature">
                    <span className="products__card-feature-icon">✓</span>
                    Inbound & outbound AI calls
                  </div>
                  <div className="products__card-feature">
                    <span className="products__card-feature-icon">✓</span>
                    Lead qualification & appointment booking
                  </div>
                  <div className="products__card-feature">
                    <span className="products__card-feature-icon">✓</span>
                    Hindi, English & 10+ regional languages
                  </div>
                  <div className="products__card-feature">
                    <span className="products__card-feature-icon">✓</span>
                    CRM integration (Zoho, HubSpot)
                  </div>
                </div>
              </div>
              <div className="products__card-visual">
                <div className="products__card-visual-ring">
                  <span className="products__card-visual-icon">🤖</span>
                </div>
              </div>
            </div>

            {/* LinguaLive */}
            <div className="products__card">
              <div className="products__card-icon products__card-icon--lingua">🌐</div>
              <div className="products__card-tag products__card-tag--live">
                <span className="products__card-tag-dot" />
                Live Now
              </div>
              <h3 className="products__card-title">LinguaLive — Real-Time Translator</h3>
              <p className="products__card-desc">
                Speak in any language and get instant voice translation. Powered by Gemini's native
                audio model for near-zero latency.
              </p>
              <div className="products__card-features">
                <div className="products__card-feature">
                  <span className="products__card-feature-icon">✓</span>
                  40+ languages with native accents
                </div>
                <div className="products__card-feature">
                  <span className="products__card-feature-icon">✓</span>
                  Sub-second translation speed
                </div>
                <div className="products__card-feature">
                  <span className="products__card-feature-icon">✓</span>
                  Works on any device, no app needed
                </div>
              </div>
              <Link to="/lingualive" className="products__card-link">
                Try it free
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

            {/* VivaChat */}
            <div className="products__card">
              <div className="products__card-icon products__card-icon--chat">💬</div>
              <div className="products__card-tag products__card-tag--coming">
                <span className="products__card-tag-dot" />
                Coming Soon
              </div>
              <h3 className="products__card-title">VivaChat — AI Support Agent</h3>
              <p className="products__card-desc">
                AI-powered chat agent for websites and WhatsApp. Handles FAQs, orders tracking,
                returns, and escalations — automatically.
              </p>
              <div className="products__card-features">
                <div className="products__card-feature">
                  <span className="products__card-feature-icon">✓</span>
                  Website widget + WhatsApp integration
                </div>
                <div className="products__card-feature">
                  <span className="products__card-feature-icon">✓</span>
                  Trains on your data in minutes
                </div>
                <div className="products__card-feature">
                  <span className="products__card-feature-icon">✓</span>
                  Smart escalation to human agents
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="how-it-works fade-up" ref={addRef}>
        <div className="how-it-works__inner">
          <p className="how-it-works__label">How It Works</p>
          <h2 className="how-it-works__title">Go Live in 3 Simple Steps</h2>

          <div className="how-it-works__steps">
            <div className="how-it-works__step">
              <div className="how-it-works__step-number">1</div>
              <h3 className="how-it-works__step-title">Tell Us Your Needs</h3>
              <p className="how-it-works__step-text">
                Share your business type, call volume, and common customer queries. We design
                the perfect AI agent for you.
              </p>
            </div>
            <div className="how-it-works__step">
              <div className="how-it-works__step-number">2</div>
              <h3 className="how-it-works__step-title">We Build & Train</h3>
              <p className="how-it-works__step-text">
                Our AI learns your products, pricing, FAQs, and brand voice. Fine-tuned to
                handle your exact use cases.
              </p>
            </div>
            <div className="how-it-works__step">
              <div className="how-it-works__step-number">3</div>
              <h3 className="how-it-works__step-title">Go Live in 48 Hours</h3>
              <p className="how-it-works__step-text">
                Connect to your phone number or website. Your AI agent starts handling calls
                and chats — instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ USE CASES ═══════ */}
      <section className="use-cases fade-up" ref={addRef}>
        <div className="use-cases__inner">
          <p className="use-cases__label">Use Cases</p>
          <h2 className="use-cases__title">Built for Every Industry</h2>

          <div className="use-cases__grid">
            <div className="use-cases__card">
              <div className="use-cases__card-emoji">🏠</div>
              <h3 className="use-cases__card-title">Real Estate</h3>
              <p className="use-cases__card-text">
                Auto-qualify property inquiries, schedule site visits, and follow up with leads —
                even at midnight.
              </p>
            </div>
            <div className="use-cases__card">
              <div className="use-cases__card-emoji">🛒</div>
              <h3 className="use-cases__card-title">E-Commerce</h3>
              <p className="use-cases__card-text">
                Handle order status, return requests, and product queries across calls and WhatsApp.
              </p>
            </div>
            <div className="use-cases__card">
              <div className="use-cases__card-emoji">🏥</div>
              <h3 className="use-cases__card-title">Healthcare</h3>
              <p className="use-cases__card-text">
                Automate appointment booking, prescription reminders, and patient follow-ups in
                any language.
              </p>
            </div>
            <div className="use-cases__card">
              <div className="use-cases__card-emoji">🎓</div>
              <h3 className="use-cases__card-title">Ed-Tech</h3>
              <p className="use-cases__card-text">
                Handle student inquiries, enrollment calls, and course information 24/7 without
                human intervention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ METRICS ═══════ */}
      <section className="metrics fade-up" ref={addRef}>
        <div className="metrics__inner">
          <h2 className="metrics__title">The Impact We Deliver</h2>
          <div className="metrics__grid">
            <div className="metrics__card">
              <div className="metrics__card-number">70%</div>
              <div className="metrics__card-label">Cost Reduction</div>
            </div>
            <div className="metrics__card">
              <div className="metrics__card-number">24/7</div>
              <div className="metrics__card-label">Availability</div>
            </div>
            <div className="metrics__card">
              <div className="metrics__card-number">&lt;1s</div>
              <div className="metrics__card-label">Response Time</div>
            </div>
            <div className="metrics__card">
              <div className="metrics__card-number">40+</div>
              <div className="metrics__card-label">Languages</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ CTA SECTION ═══════ */}
      <section className="cta-section fade-up" ref={addRef}>
        <div className="cta-section__glow" />
        <div className="cta-section__inner">
          <h2 className="cta-section__title">
            Ready to Stop Missing Calls & Losing Customers?
          </h2>
          <p className="cta-section__text">
            Get a free 30-minute consultation and see how VivaBot can automate your business
            conversations starting today.
          </p>
          <div className="cta-section__actions">
            <a href="mailto:yashvivabot@gmail.com" className="cta-section__btn cta-section__btn--primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.908.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Book Free Demo
            </a>
            <Link to="/lingualive" className="cta-section__btn cta-section__btn--secondary">
              Try LinguaLive Free →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__top">
            <div>
              <div className="footer__brand">
                <span className="footer__brand-dot" />
                <span className="footer__brand-name">VIVABOT</span>
              </div>
              <p className="footer__desc">
                AI-powered conversational agents that help Indian businesses automate marketing,
                sales, and customer support — 24/7, in every language.
              </p>
            </div>
            <div>
              <h4 className="footer__col-title">Products</h4>
              <div className="footer__col-links">
                <span className="footer__col-link">VivaCaller</span>
                <Link to="/lingualive" className="footer__col-link">LinguaLive</Link>
                <span className="footer__col-link">VivaChat</span>
              </div>
            </div>
            <div>
              <h4 className="footer__col-title">Company</h4>
              <div className="footer__col-links">
                <Link to="/about" className="footer__col-link">About Us</Link>
                <a href="mailto:yashvivabot@gmail.com" className="footer__col-link">Careers</a>
                <a href="mailto:yashvivabot@gmail.com" className="footer__col-link">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="footer__col-title">Connect</h4>
              <div className="footer__col-links">
                <a href="mailto:yashvivabot@gmail.com" className="footer__col-link">yashvivabot@gmail.com</a>
                <a href="https://linkedin.com/in/yash-nagar-a7484827b/" target="_blank" rel="noopener noreferrer" className="footer__col-link">LinkedIn</a>
                <a href="https://x.com/Yashnagar_coder" target="_blank" rel="noopener noreferrer" className="footer__col-link">X / Twitter</a>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <p className="footer__copy">
              © {new Date().getFullYear()} VivaBot Technologies. All rights reserved. | Made in Rajasthan 🇮🇳
            </p>
            <div className="footer__socials">
              <a href="https://linkedin.com/in/yash-nagar-a7484827b/" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="https://x.com/Yashnagar_coder" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Twitter">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://instagram.com/yashnagar_vb/" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Voice Assistant Orb */}
      <VoiceAssistant persona="jenie" position="right" name="Jenie" />
    </>
  );
}

/* ═══════════════════════════════════════
   APP SHELL
   ═══════════════════════════════════════ */
function App() {
  const location = useLocation();
  const isLinguaLive = location.pathname === '/lingualive';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

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
      {!isLinguaLive && (
        <nav className={`nav ${mobileMenuOpen ? 'nav--menu-open' : ''}`} id="main-nav">
          <div className="nav__logo">
            <span className="nav__logo-dot" />
            VIVABOT
          </div>

          <ul className="nav__links">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <li className="nav__link" id="nav-home">Home</li>
            </Link>
            <Link to="/about" style={{ textDecoration: 'none' }}>
              <li className="nav__link" id="nav-about">About</li>
            </Link>
            <Link to="/lingualive" style={{ textDecoration: 'none' }}>
              <li className="nav__link nav__link--lingua" id="nav-lingualive">
                <span className="nav__link-lingua-dot" />
                LinguaLive
              </li>
            </Link>
          </ul>

          <a href="mailto:yashvivabot@gmail.com" className="nav__cta" id="nav-cta-demo" style={{ textDecoration: 'none' }}>
            <span>Book a Demo</span>
            <span className="nav__cta-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </span>
          </a>

          <button
            className={`nav__mobile-toggle ${mobileMenuOpen ? 'nav__mobile-toggle--open' : ''}`}
            id="nav-mobile-toggle"
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span /><span /><span />
          </button>
        </nav>
      )}

      {/* ═══════ MOBILE MENU OVERLAY ═══════ */}
      {mobileMenuOpen && (
        <div className="mobile-menu" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu__panel" onClick={e => e.stopPropagation()}>
            <ul className="mobile-menu__links">
              <Link to="/" style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
                <li className="mobile-menu__link" style={{ animationDelay: '0.05s' }}>Home</li>
              </Link>
              <Link to="/about" style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
                <li className="mobile-menu__link" style={{ animationDelay: '0.1s' }}>About</li>
              </Link>
              <Link to="/lingualive" style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
                <li className="mobile-menu__link mobile-menu__link--lingua" style={{ animationDelay: '0.15s' }}>
                  <span className="nav__link-lingua-dot" />
                  LinguaLive
                </li>
              </Link>
              <a href="mailto:yashvivabot@gmail.com" style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
                <li className="mobile-menu__link" style={{ animationDelay: '0.2s' }}>Book a Demo</li>
              </a>
            </ul>
            <div className="mobile-menu__footer">
              <p className="mobile-menu__tagline">AI-Powered Conversational Intelligence</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ROUTES ═══════ */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/lingualive" element={<LinguaLive />} />
      </Routes>
    </>
  );
}

export default App;
