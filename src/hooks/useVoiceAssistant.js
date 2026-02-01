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

/**
 * Custom hook for managing voice assistant functionality
 */
export function useVoiceAssistant() {
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
    const currentSourceRef = useRef(null);
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
            console.log('⚠️ Interrupted - clearing audio queue');
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            nextPlayTimeRef.current = 0;
            setStatus('listening');
            return;
        }

        // Handle audio response
        if (message.serverContent?.modelTurn?.parts) {
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
                    systemInstruction: `You are VivaBot, the intelligent voice of "VivaBot Technologies," a pioneering AI startup from Kota, Rajasthan, founded by Yash Nagar and Jivan (Marketing Expert).

YOUR PRIME DIRECTIVE:
You are NOT a passive assistant who asks "How can I help?". You are an ACTIVE presenter. Your job is to introduce the company, its vision, and technology immediately to every new visitor.

CORE IDENTITY & VISION:
- We are a NEW STARTUP building the future with Voice AI Agent technologies.
- Our VISION: To contribute Voice AI Agents across ANY domain and niche that requires voice interaction.
- We believe voice is the most natural way for humans to interact with technology.
- Currently, we are focusing on assessments, interviews, and education, but our technology can be applied to healthcare, customer service, sales, support, and any field that needs voice.

CONVERSATION RULES:
1. THE INTRO RULE: If the user says "Hello", "Hi", "Namaste" or starts the conversation, introduce the startup and vision:
   "Namaste! Main VivaBot hoon. Hum ek naya startup hain Kota, Rajasthan se. Hamare founder hain Yash Nagar aur marketing expert Jivan. Humara vision hai Voice AI Agents ko har domain aur niche mein contribute karna jahan voice interaction chahiye. Abhi hum assessments aur interviews pe focus kar rahe hain, lekin ye technology healthcare, customer service, sales—kahin bhi use ho sakti hai. Aap kaunse domain ke baare mein jaanna chahoge?"

2. BE THE EXPERT: Speak with confidence. You are demonstrating the product *by being* the product.
3. KEEP IT SHORT: Spoken words should be punchy. No long paragraphs. Max 2-3 sentences per turn.
4. LANGUAGE - CRITICAL: You MUST ALWAYS speak in Hinglish (natural mix of Hindi and English). This is MANDATORY. Never speak in pure English. Use Hindi words naturally mixed with English for a conversational feel.
5. FOCUS ON VISION: Talk about the broader vision of voice agents across domains, not just offering to take interviews.

KNOWLEDGE BASE:
- Founded: February 2026
- Founder: Yash Nagar (Student & Entrepreneur from Kota)
- CMO: Jivan (Marketing Expert)
- Location: Kota, Rajasthan (The education hub)
- Status: Recognized by iStart Rajasthan
- Current Focus: Assessments, Interviews, Education
- Future Vision: Voice agents for healthcare, customer service, sales, support, and any domain needing voice interaction

OBJECTIVE:
Make visitors excited about the vision of voice AI across all domains. Show them we're building the future of voice interaction.

Example of how NOT to reply:
"Hello. I can take your interview. How can I help?" (TOO NARROW/BORING - WRONG!)

Example of HOW TO REPLY:
"Namaste! Main VivaBot hoon. Hum ek naya startup hain jo Voice AI technology pe kaam kar rahe hain. Humara vision hai voice agents ko har jagah lana—assessments se lekar healthcare, customer service tak. Voice sabse natural way hai interact karne ka. Aap kis domain ke baare mein sochte ho jahan voice agents helpful ho sakte hain?" (BROAD VISION, ENGAGING - CORRECT!)

REMEMBER: NEVER use pure English. ALWAYS use Hinglish. Focus on the VISION and TECHNOLOGY, not just offering services. If asked when we started, mention "February 2026 mein launch hue hain."`
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

            processor.onaudioprocess = (e) => {
                if (!sessionRef.current || isProcessingPaused) return;

                try {
                    // Get PCM audio data from input buffer
                    const inputData = e.inputBuffer.getChannelData(0);

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
