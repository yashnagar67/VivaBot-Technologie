import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { config } from '../config';
import {
    getMicrophoneStream,
    audioBufferToBase64,
    base64ToAudioBuffer,
    createAudioContext,
    playAudioBuffer,
    stopMediaStream
} from '../utils/audioUtils';

// Persona system prompts
const PERSONAS = {
    vivabot: `You are VivaBot, the intelligent voice of "VivaBot Technologies," a pioneering AI startup from Kota, Rajasthan, founded by Yash Nagar and Jivan (Marketing Expert).

YOUR PRIME DIRECTIVE:
You are NOT a passive assistant who asks "How can I help?". You are an ACTIVE presenter. Your job is to introduce the company, its vision, and technology immediately to every new visitor.

CORE IDENTITY & VISION:
- We are a NEW STARTUP building the future with Voice AI Agent technologies.
- Our VISION: To contribute Voice AI Agents across ANY domain and niche that requires voice interaction.
- We believe voice is the most natural way for humans to interact with technology.
- Currently, we are focusing on assessments, interviews, and education, but our technology can be applied to healthcare, customer service, sales, support, and any field that needs voice.

CONVERSATION RULES:
1. THE INTRO RULE: If the user says "Hello", "Hi", "Namaste" or starts the conversation, introduce the startup and vision:
   "Namaste! Main VivaBot hoon. Hum ek naya startup hain Kota, Rajasthan se. Hamare founder hain Yash Naagar aur marketing expert Jivan. Humara vision hai Voice AI Agents ko har domain aur niche mein contribute karna jahan voice interaction chahiye. Abhi hum assessments aur interviews pe focus kar rahe hain, lekin ye technology healthcare, customer service, sales—kahin bhi use ho sakti hai. Aap kaunse domain ke baare mein jaanna chahoge?"

2. BE THE EXPERT: Speak with confidence. You are demonstrating the product *by being* the product.
3. KEEP IT SHORT: Spoken words should be punchy. No long paragraphs. Max 2-3 sentences per turn.
4. LANGUAGE RULE: 
   - DEFAULT: Always speak in Hinglish (natural mix of Hindi and English) by default.
   - FLEXIBILITY: If the user explicitly asks you to speak in ANY specific language, then switch to that language.
5. FOCUS ON VISION: Talk about the broader vision of voice agents across domains.

KNOWLEDGE BASE:
- Founded: February 2026
- Founder: Yash Nagar (Student & Entrepreneur from Kota)
- CMO: Jivan (Marketing Expert)
- Location: Kota, Rajasthan
- Status: Recognized by iStart Rajasthan

REMEMBER: Focus on the VISION and TECHNOLOGY. If asked when we started, mention "February 2026 mein launch hue hain."`,

    jamie: `You are Jamie, a supportive Hinglish-speaking friend. Mix Hindi and English naturally. Be empathetic, give advice, and listen well. Arre yaar, keep it chill and human. You have access to Google Search to look up real-time information if the user asks about recent events, news, or facts.

CONVERSATION STYLE:
- Be warm, friendly, and relatable like a best friend
- Use Hinglish naturally (mix Hindi and English)
- Listen actively and respond with empathy
- Give practical advice when asked
- Keep responses short and conversational (2-3 sentences max)
- Use casual expressions like "Arre yaar", "Dekh", "Chill kar", etc.

EXAMPLE GREETINGS:
- "Hey! Kya haal bhai? Main Jamie hoon, teri dost. Bata, kya chal raha hai?"
- "Arre yaar! Suno na, main hoon Jamie. Aaj ka din kaisa ja raha hai?"

CAPABILITIES:
- Emotional support and friendly conversations
- Advice on daily life situations
- Real-time information via Google Search (news, facts, current events)
- Just being a chill friend to talk to

REMEMBER:
- Always use Hinglish (mix of Hindi and English)
- Be supportive and non-judgmental
- If user asks about current events/news, use Google Search
- Keep it light and friendly, like talking to a close friend`,

    jenie: `You are Jenie, an intelligent and friendly AI voice assistant created by VivaBot Technologies. You are a CONVERSATION bot, not an introduction bot.

YOUR PERSONALITY:
- Warm, witty, and genuinely helpful
- You love having real conversations — not just answering questions
- You speak naturally in Hinglish (mix of Hindi and English) by default
- If the user speaks in a specific language, match their language

CONVERSATION RULES:
1. NEVER start by introducing the company. You are here to TALK, not to pitch.
2. Greet warmly and ask what the user wants to chat about.
3. Keep responses SHORT — 2-3 sentences max per turn.
4. Be curious — ask follow-up questions to keep the conversation going.
5. You can discuss ANYTHING — tech, life, advice, fun facts, help with problems.
6. If someone asks about VivaBot, you can mention it briefly, but don't make it the focus.

EXAMPLE GREETINGS:
- "Hey! Main Jenie hoon. Batao, kya discuss karna hai aaj?"
- "Hi there! Jenie here. What's on your mind?"

CAPABILITIES:
- General knowledge and conversations
- Tech discussions and advice
- Problem solving and brainstorming
- Real-time info via Google Search when needed
- Just being a great conversational partner

REMEMBER: You are a conversational companion, NOT a sales pitch bot.`
};

/**
 * Custom hook for managing voice assistant functionality
 * @param {string} persona - 'vivabot' or 'jamie'
 */
export function useVoiceAssistant(persona = 'vivabot') {
    const [status, setStatus] = useState('idle'); // idle, connecting, listening, speaking, error
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);


    const sessionRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null); // For recording at 16kHz
    const playbackContextRef = useRef(null); // For playback at 24kHz
    const audioQueueRef = useRef([]);
    const isPlayingRef = useRef(false);
    const playbackLoopRunningRef = useRef(false);
    const activeSourcesRef = useRef([]);
    const nextPlayTimeRef = useRef(0);

    /**
     * Fetch ephemeral token from backend
     */
    const fetchApiKey = async () => {
        try {
            // Fetch ephemeral token from backend
            console.log('🔑 Fetching ephemeral token from backend...');
            const response = await fetch('https://vivabot-agent-token-backend.onrender.com/api/voice/generate-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend response:', errorText);
                throw new Error(`Failed to fetch token: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Ephemeral token received');

            if (!data.token) {
                throw new Error('No token in response');
            }

            // Return the ephemeral token (format: "auth_tokens/...")
            return data.token;
        } catch (err) {
            console.error('❌ Token fetch error:', err);
            throw new Error('Could not connect to backend');
        }
    };


    /**
     * Continuous playback loop - plays audio chunks without gaps
     */
    const playbackLoop = useCallback(async () => {
        if (playbackLoopRunningRef.current) return;

        playbackLoopRunningRef.current = true;
        console.log('🔄 Starting continuous playback loop');

        while (playbackLoopRunningRef.current) {
            if (audioQueueRef.current.length === 0) {
                // No audio to play, wait a bit
                await new Promise(resolve => setTimeout(resolve, 10));
                if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                    // Stop the loop if we're done playing
                    setStatus('listening');
                }
                continue;
            }

            // Get next chunk from queue
            const audioData = audioQueueRef.current.shift();

            if (!isPlayingRef.current) {
                isPlayingRef.current = true;
                setStatus('speaking');
                nextPlayTimeRef.current = playbackContextRef.current.currentTime;
            }

            try {
                // Convert PCM to AudioBuffer
                const audioBuffer = playbackContextRef.current.createBuffer(
                    1, // mono
                    audioData.byteLength / 2, // 16-bit = 2 bytes per sample
                    24000 // 24kHz output
                );

                const channelData = audioBuffer.getChannelData(0);
                const view = new DataView(audioData);

                for (let i = 0; i < channelData.length; i++) {
                    const int16 = view.getInt16(i * 2, true);
                    channelData[i] = int16 / 32768.0;
                }

                // Schedule playback at the right time to avoid gaps
                const source = playbackContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(playbackContextRef.current.destination);

                const currentTime = playbackContextRef.current.currentTime;
                const startTime = Math.max(currentTime, nextPlayTimeRef.current);

                // Track this source so we can stop it on interruption
                activeSourcesRef.current.push(source);

                // Remove from tracking when it ends
                source.onended = () => {
                    const index = activeSourcesRef.current.indexOf(source);
                    if (index > -1) {
                        activeSourcesRef.current.splice(index, 1);
                    }
                };

                source.start(startTime);
                nextPlayTimeRef.current = startTime + audioBuffer.duration;

                console.log('🔊 Playing chunk, duration:', audioBuffer.duration.toFixed(3), 's');

            } catch (err) {
                console.error('❌ Playback error:', err);
            }

            // Small delay to prevent tight loop
            await new Promise(resolve => setTimeout(resolve, 1));
        }

        isPlayingRef.current = false;
        console.log('⏹️ Playback loop stopped');
    }, [isConnected]);

    /**
     * Handle incoming messages from Gemini
     */
    const handleMessage = useCallback((message) => {
        console.log('📨 Received message:', message);

        // Handle interruption
        if (message.serverContent?.interrupted) {
            console.log('⚠️ Interrupted - stopping all audio immediately');

            // Stop all currently playing audio sources
            activeSourcesRef.current.forEach(source => {
                try {
                    source.stop();
                } catch (e) {
                    // Source might already be stopped
                }
            });
            activeSourcesRef.current = [];

            // Clear audio queue and reset playback state
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            nextPlayTimeRef.current = 0;
            playbackLoopRunningRef.current = false;

            setStatus('listening');
            return;
        }

        // Handle audio response
        if (message.serverContent?.modelTurn?.parts) {
            // Check if this is a new turn (first chunk of new response)
            // Clear old audio if we're starting a fresh response
            if (message.serverContent.turnComplete === false && audioQueueRef.current.length === 0) {
                console.log('🆕 New model turn starting - ensuring clean state');
                // Stop any lingering audio
                activeSourcesRef.current.forEach(source => {
                    try {
                        source.stop();
                    } catch (e) {
                        // Already stopped
                    }
                });
                activeSourcesRef.current = [];
                isPlayingRef.current = false;
                nextPlayTimeRef.current = 0;
            }

            for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                    console.log('🎵 Received audio chunk:', part.inlineData.data.length, 'bytes (base64)');
                    const audioData = base64ToAudioBuffer(part.inlineData.data);
                    console.log('🎵 Decoded to:', audioData.byteLength, 'bytes');
                    audioQueueRef.current.push(audioData);
                }
            }

            // Start playback loop if not already running
            if (audioQueueRef.current.length > 0 && !playbackLoopRunningRef.current) {
                console.log('▶️ Starting playback, queue size:', audioQueueRef.current.length);
                playbackLoop();
            }
        }

        // Handle turn complete - clear queue after this turn finishes
        if (message.serverContent?.turnComplete) {
            console.log('✅ Turn complete - ready for next interaction');
        }
    }, [playbackLoop]);

    /**
     * Start voice assistant session
     */
    const start = useCallback(async () => {
        try {
            console.log('🎤 Starting voice assistant...');
            setStatus('connecting');
            setError(null);

            // Get ephemeral token from backend
            console.log('📡 Fetching ephemeral token from backend...');
            const apiKey = await fetchApiKey();
            console.log('✅ Ephemeral token received');

            // Initialize Gemini client with ephemeral token
            console.log('🤖 Initializing Gemini client with ephemeral token...');
            const genAI = new GoogleGenAI({
                apiKey,
                httpOptions: {
                    apiVersion: 'v1alpha'
                }
            });

            // Check if live API is available
            console.log('🔍 Checking Live API availability...');
            console.log('genAI object:', genAI);
            console.log('genAI.live:', genAI.live);

            if (!genAI.live) {
                throw new Error('Live API not available in this SDK version. The browser SDK may not support Live API yet.');
            }

            // Create audio contexts
            if (!audioContextRef.current) {
                console.log('🔊 Creating audio contexts...');
                audioContextRef.current = createAudioContext(16000); // For recording
                playbackContextRef.current = createAudioContext(24000); // For playback
            }

            // Get microphone access
            console.log('🎙️ Requesting microphone access...');
            const stream = await getMicrophoneStream();
            mediaStreamRef.current = stream;
            console.log('✅ Microphone access granted');

            // Connect to Gemini Live API
            console.log('🌐 Connecting to Gemini Live API...');
            console.log('Model:', config.gemini.model);

            const session = await genAI.live.connect({
                model: config.gemini.model,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: 'Kore'
                            }
                        }
                    },
                    tools: persona === 'jamie' ? [{ googleSearch: {} }] : [],
                    systemInstruction: PERSONAS[persona] || PERSONAS.vivabot
                },
                callbacks: {
                    onopen: () => {
                        console.log('✅ Connected to Gemini Live API');
                        setIsConnected(true);
                        setStatus('listening');
                    },
                    onmessage: handleMessage,
                    onerror: (e) => {
                        console.error('❌ WebSocket error:', e);
                        console.error('Error details:', JSON.stringify(e, null, 2));
                        setError(`Connection error: ${e.message || 'Unknown error'}`);
                        setStatus('error');
                    },
                    onclose: (e) => {
                        console.log('🔌 Connection closed');
                        console.log('Close code:', e.code);
                        console.log('Close reason:', e.reason);
                        console.log('Was clean:', e.wasClean);

                        // Code 1000 is normal closure, not an error
                        if (e.code !== 1000 && !e.wasClean) {
                            console.error('❌ WebSocket closed unexpectedly!', e);
                            setError(`Connection closed: ${e.reason || 'Unknown reason'} (Code: ${e.code})`);
                            setStatus('error');
                        } else {
                            console.log('✅ Connection closed normally');
                            setStatus('idle');
                        }

                        setIsConnected(false);
                    }
                }
            });

            sessionRef.current = session;
            console.log('✅ Session created');

            // Set up audio processing for PCM capture
            console.log('🎬 Setting up PCM audio capture...');

            // Create audio source from microphone stream
            const audioSource = audioContextRef.current.createMediaStreamSource(stream);

            // Create script processor for audio capture (deprecated but widely supported)
            // Buffer size: 4096 samples, 1 input channel, 1 output channel
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            // Create a gain node with volume 0 to prevent feedback but keep processor active
            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.value = 0; // Mute the output to prevent hearing yourself

            // Flag to pause processing during playback
            let isProcessingPaused = false;
            let lastSpeechTime = 0;

            processor.onaudioprocess = (e) => {
                if (!sessionRef.current || isProcessingPaused) return;

                try {
                    // Get PCM audio data from input buffer
                    const inputData = e.inputBuffer.getChannelData(0);


                    // OPTIMIZED: Voice activity detection - only runs when bot is speaking (zero latency impact on responses)
                    if (isPlayingRef.current) {
                        // Quick volume check (RMS) - only when needed
                        let sum = 0;
                        for (let i = 0; i < inputData.length; i++) {
                            sum += inputData[i] * inputData[i];
                        }
                        const volume = Math.sqrt(sum / inputData.length);

                        // Higher threshold to avoid false triggers
                        if (volume > 0.05 && Date.now() - lastSpeechTime > 300) {
                            console.log('🎤 User speaking - interrupting bot');

                            // Immediate interruption
                            activeSourcesRef.current.forEach(source => {
                                try { source.stop(); } catch (e) { }
                            });
                            activeSourcesRef.current = [];
                            audioQueueRef.current = [];
                            isPlayingRef.current = false;
                            nextPlayTimeRef.current = 0;
                            playbackLoopRunningRef.current = false;
                            setStatus('listening');

                            lastSpeechTime = Date.now();
                        }
                    }


                    // Convert Float32Array to Int16Array (PCM 16-bit)
                    const pcmData = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        // Clamp to [-1, 1] and convert to 16-bit integer
                        const s = Math.max(-1, Math.min(1, inputData[i]));
                        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }

                    // Convert to base64
                    const base64Audio = audioBufferToBase64(pcmData.buffer);

                    // Send to Gemini with PCM format
                    sessionRef.current.sendRealtimeInput({
                        audio: {
                            data: base64Audio,
                            mimeType: 'audio/pcm;rate=16000'
                        }
                    });

                    console.log('📤 Sent PCM audio:', pcmData.length, 'samples');
                } catch (err) {
                    console.error('❌ Audio processing error:', err);
                }
            };

            // Connect: microphone -> processor -> gainNode (volume 0) -> destination
            // This keeps the processor active but prevents feedback
            audioSource.connect(processor);
            processor.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);

            // Store references for cleanup
            mediaRecorderRef.current = {
                processor,
                audioSource,
                gainNode,
                pauseProcessing: () => { isProcessingPaused = true; },
                resumeProcessing: () => { isProcessingPaused = false; }
            };

            console.log('✅ PCM audio capture started');

        } catch (err) {
            console.error('❌ Start error:', err);
            setError(err.message);
            setStatus('error');
            cleanup();
        }
    }, [handleMessage]);

    /**
     * Stop voice assistant session
     */
    const stop = useCallback(() => {
        cleanup();
        setStatus('idle');
        setIsConnected(false);
    }, []);

    /**
     * Cleanup resources
     */
    const cleanup = useCallback(() => {
        // Stop playback loop
        playbackLoopRunningRef.current = false;

        // Disconnect audio processor
        if (mediaRecorderRef.current) {
            try {
                if (mediaRecorderRef.current.processor) {
                    mediaRecorderRef.current.processor.disconnect();
                }
                if (mediaRecorderRef.current.gainNode) {
                    mediaRecorderRef.current.gainNode.disconnect();
                }
                if (mediaRecorderRef.current.audioSource) {
                    mediaRecorderRef.current.audioSource.disconnect();
                }
            } catch (e) {
                console.log('Processor already disconnected');
            }
        }
        mediaRecorderRef.current = null;

        // Stop microphone stream
        if (mediaStreamRef.current) {
            stopMediaStream(mediaStreamRef.current);
            mediaStreamRef.current = null;
        }

        // Close session
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }

        // Close audio contexts
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (playbackContextRef.current) {
            playbackContextRef.current.close();
            playbackContextRef.current = null;
        }

        // Clear audio queue
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        nextPlayTimeRef.current = 0;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    return {
        status,
        error,
        isConnected,
        start,
        stop
    };
}
