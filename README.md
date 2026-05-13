# VivaBot Technologies

VivaBot Technologies is a next-generation conversational AI platform tailored for Indian businesses. We provide real-time, bi-directional AI voice agents that automate customer support, sales qualification, and appointment scheduling with sub-second latency and natural human-like interaction.

## 🌟 Core Features

- **Real-Time Voice AI:** Sub-second latency conversations powered by the Gemini Live API over WebSockets.
- **Dynamic Personas:** Context-aware agents (e.g., E-commerce Support, Real Estate, Healthcare, Ed-Tech) that adapt their behavior and knowledge instantly.
- **LinguaLive Translation:** Real-time voice translation across 40+ languages using native audio models.
- **Natural Interruption Handling:** Gapless audio playback engine that instantly stops and listens when the user interrupts the AI.
- **Multilingual Support:** Native support for English, Hindi, and Hinglish.

## 🛠️ Technical Stack

- **Frontend:** React.js, Vite, React Router
- **AI/LLM:** Google Gemini Live API (`gemini-3.1-flash-live-preview`), `@google/genai` SDK
- **Audio Processing:** Web Audio API (16kHz PCM capture, 24kHz asynchronous gapless playback)
- **Styling:** Custom CSS with a premium, accessible design system inspired by Sarvam AI
- **Security:** Node.js/Express backend for generating short-lived ephemeral auth tokens

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Gemini API Key
- An active instance of the VivaBot Token Backend running to serve ephemeral tokens.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/VivaBot-Technologies.git
   cd VivaBot-Technologies
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your backend URL (if running locally):
   ```env
   VITE_BACKEND_URL=http://localhost:5000
   ```
   *Note: If not provided, the app defaults to using the production backend hosted on Render.*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Architecture Highlights

- **Gapless Audio Engine:** A custom playback loop decodes incoming Base64 audio chunks into `AudioBuffer`s and schedules `AudioBufferSourceNode`s continuously, ensuring the AI's voice never stutters.
- **WebSocket State Management:** A robust custom React hook (`useVoiceAssistant`) manages the complex WebSocket lifecycle, automatically handling reconnections and tracking the agent's state (`idle`, `listening`, `speaking`).
- **Secure Authentication:** The frontend never stores or exposes the Gemini API key. Instead, it fetches a temporary, short-lived ephemeral token from the Node.js backend before establishing the WebSocket handshake.

## 📄 License

© 2026 VivaBot Technologies. All rights reserved. | Made in Rajasthan 🇮🇳
