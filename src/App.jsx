import { useEffect } from 'react';
import ReactGA from "react-ga4";
import VoiceAssistant from './components/VoiceAssistant';

function App() {
  // App component ke andar
  ReactGA.initialize("G-6WQ0EQ20DJ");

  // Ye track karega ki page khula
  ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Courier+Prime:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 md:p-12">
      {/* Paper Container */}
      <div className="w-full max-w-2xl bg-white shadow-sm border border-stone-100 p-12 md:p-16 relative">
        {/* Subtle Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-noise" />

        {/* Content */}
        <div className="relative z-10">
          {/* Reference Header */}
          <div className="mb-12 font-mono text-xs text-stone-500 tracking-wide space-y-1">
            <div>Ref: VB-2026-OCT</div>
            <div>Status: ACQUIRED</div>
          </div>

          {/* Main Logo/Title */}
          <div className="text-center mb-12">
            <h1
              className="text-4xl md:text-5xl text-stone-800 mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              VivaBot Technologies
            </h1>
            <div className="w-24 h-px bg-stone-300 mx-auto mt-6" />
          </div>

          {/* Divider */}
          <div className="border-t border-stone-200 my-12" />

          {/* Body Text */}
          <div className="space-y-6 text-stone-700 leading-relaxed text-justify">
            <p className="text-base md:text-lg">
              This domain is officially acquired and maintained by VivaBot Technologies.
            </p>

            <p className="text-base md:text-lg">
              We are currently building the future of AI-driven assessments—a platform designed
              to revolutionize oral examinations and voice-based evaluations for educational
              institutions and students worldwide.
            </p>

            <p className="text-base md:text-lg">
              Our mission is to make quality assessment accessible, scalable, and intelligent
              through the power of artificial intelligence.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-stone-200 my-12" />

          {/* Footer - Inquiries */}
          <div className="text-center">
            <p className="text-sm text-stone-500 mb-3">For inquiries, please contact:</p>
            <a
              href="mailto:hello@vivabot.tech"
              className="text-stone-700 hover:text-stone-900 transition-colors font-mono text-sm underline decoration-stone-300 hover:decoration-stone-500"
            >
              hello@vivabot.tech
            </a>
          </div>

          {/* Date Stamp */}
          <div className="mt-12 pt-8 border-t border-stone-100 text-center">
            <p className="font-mono text-xs text-stone-400 tracking-wider">
              ESTABLISHED JANUARY 2026
            </p>
          </div>
        </div>
      </div>

      {/* Voice Assistants - Dual Bots */}
      {/* Jamie (Friendly Bot) - LEFT side */}
      <VoiceAssistant persona="jamie" position="left" name="Jamie" />

      {/* VivaBot (Intro Bot) - RIGHT side */}
      <VoiceAssistant persona="vivabot" position="right" name="VivaBot" />
    </div>
  );
}

export default App;
