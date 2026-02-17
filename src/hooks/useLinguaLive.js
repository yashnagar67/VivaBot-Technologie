import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { config } from '../config';
import {
    getMicrophoneStream,
    audioBufferToBase64,
    base64ToAudioBuffer,
    createAudioContext,
    stopMediaStream
} from '../utils/audioUtils';

// All supported languages
export const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: 'Chinese (Mandarin)', native: '中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
    { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
    { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
    { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
    { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
    { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱' },
    { code: 'sv', name: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
    { code: 'da', name: 'Danish', native: 'Dansk', flag: '🇩🇰' },
    { code: 'no', name: 'Norwegian', native: 'Norsk', flag: '🇳🇴' },
    { code: 'fi', name: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
    { code: 'th', name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'uk', name: 'Ukrainian', native: 'Українська', flag: '🇺🇦' },
    { code: 'cs', name: 'Czech', native: 'Čeština', flag: '🇨🇿' },
    { code: 'el', name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'he', name: 'Hebrew', native: 'עברית', flag: '🇮🇱' },
    { code: 'ro', name: 'Romanian', native: 'Română', flag: '🇷🇴' },
    { code: 'hu', name: 'Hungarian', native: 'Magyar', flag: '🇭🇺' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'sw', name: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
    { code: 'fil', name: 'Filipino', native: 'Filipino', flag: '🇵🇭' },
    { code: 'bg', name: 'Bulgarian', native: 'Български', flag: '🇧🇬' },
];

function getInterpreterPrompt(targetLang) {
    return `You are a real-time voice translator. You translate everything the user says into ${targetLang}.

ABSOLUTE RULES — NEVER BREAK THESE:
1. You are a TRANSLATOR. You are NOT an AI assistant. You CANNOT have conversations.
2. Your ONLY output is the translated version of what the user said, in ${targetLang}.
3. You NEVER say things like "Sure!", "Of course!", "Here's the translation", "I'd be happy to help", "Let me translate that", or ANY filler/meta-commentary whatsoever.
4. You NEVER greet the user. You NEVER introduce yourself. You NEVER ask questions.
5. You NEVER explain, summarize, or add context. Just translate.
6. If the user says "Hello, how are you?" in English, you say the ${targetLang} equivalent of "Hello, how are you?" — NOTHING else.
7. If the user already speaks in ${targetLang}, translate it into English.
8. Translate naturally — the way a native ${targetLang} speaker would actually say it. Avoid robotic or overly literal translations.
9. Keep the speaker's tone and emotion. If they sound excited, your translation should sound excited. If they sound formal, be formal.
10. Preserve all names, numbers, dates, brand names, and proper nouns exactly as spoken.
11. If you hear silence or unclear audio, say NOTHING. Do not fill silence with words.
12. If you cannot understand a word, skip it or phonetically approximate — never ask for clarification.

EXAMPLES OF CORRECT BEHAVIOR:
- User says "I need to book a flight to Delhi" → You say the ${targetLang} version of that sentence. Nothing else.
- User says "Thank you so much" → You say the ${targetLang} version. No "You're welcome" or any response.
- User says nothing (silence) → You say nothing.

EXAMPLES OF WRONG BEHAVIOR (NEVER DO THIS):
- "Sure! Here's the translation: ..."
- "The user said ... which translates to ..."
- "Hello! I'm your translator. How can I help?"
- Any response that is not a direct translation.

You are invisible. You are a voice-to-voice translation layer. Start translating now.`;
}

/**
 * Custom hook for LinguaLive real-time translation
 */
export function useLinguaLive() {
    const [status, setStatus] = useState('idle'); // idle, connecting, listening, speaking, error
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0); // 0-1 for visualizer
    const [sessionDuration, setSessionDuration] = useState(0);
    const [isMicMuted, setIsMicMuted] = useState(true); // Push-to-talk: muted by default

    // Live transcription state
    const [lastUserText, setLastUserText] = useState('');
    const [lastModelText, setLastModelText] = useState('');

    const sessionRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const playbackContextRef = useRef(null);
    const audioQueueRef = useRef([]);
    const isPlayingRef = useRef(false);
    const playbackLoopRunningRef = useRef(false);
    const activeSourcesRef = useRef([]);
    const nextPlayTimeRef = useRef(0);
    const sessionStartRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const analyserRef = useRef(null);
    const animFrameRef = useRef(null);
    const isMicMutedRef = useRef(true); // Ref mirror for audio processor closure

    const fetchApiKey = async () => {
        try {
            const response = await fetch('https://vivabot-agent-token-backend.onrender.com/api/voice/generate-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`Token fetch failed: ${response.status}`);
            const data = await response.json();
            if (!data.token) throw new Error('No token in response');
            return data.token;
        } catch (err) {
            throw new Error('Could not connect to backend');
        }
    };

    const playbackLoop = useCallback(async () => {
        if (playbackLoopRunningRef.current) return;
        playbackLoopRunningRef.current = true;

        while (playbackLoopRunningRef.current) {
            if (audioQueueRef.current.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
                if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                    setStatus('listening');
                }
                continue;
            }

            const audioData = audioQueueRef.current.shift();

            if (!isPlayingRef.current) {
                isPlayingRef.current = true;
                setStatus('speaking');
                nextPlayTimeRef.current = playbackContextRef.current.currentTime;
            }

            try {
                const audioBuffer = playbackContextRef.current.createBuffer(
                    1, audioData.byteLength / 2, 24000
                );
                const channelData = audioBuffer.getChannelData(0);
                const view = new DataView(audioData);
                for (let i = 0; i < channelData.length; i++) {
                    const int16 = view.getInt16(i * 2, true);
                    channelData[i] = int16 / 32768.0;
                }

                const source = playbackContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(playbackContextRef.current.destination);

                const currentTime = playbackContextRef.current.currentTime;
                const startTime = Math.max(currentTime, nextPlayTimeRef.current);

                activeSourcesRef.current.push(source);
                source.onended = () => {
                    const idx = activeSourcesRef.current.indexOf(source);
                    if (idx > -1) activeSourcesRef.current.splice(idx, 1);
                };
                source.start(startTime);
                nextPlayTimeRef.current = startTime + audioBuffer.duration;
            } catch (err) {
                console.error('Playback error:', err);
            }

            await new Promise(resolve => setTimeout(resolve, 1));
        }
        isPlayingRef.current = false;
    }, []);

    const handleMessage = useCallback((message) => {
        // Handle interruption
        if (message.serverContent?.interrupted) {
            activeSourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
            activeSourcesRef.current = [];
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            nextPlayTimeRef.current = 0;
            playbackLoopRunningRef.current = false;
            setStatus('listening');
            return;
        }

        // Handle audio from model
        if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                    const audioData = base64ToAudioBuffer(part.inlineData.data);
                    audioQueueRef.current.push(audioData);
                }
            }

            if (audioQueueRef.current.length > 0 && !playbackLoopRunningRef.current) {
                playbackLoop();
            }
        }

        // Live input transcription (what the user said)
        if (message.serverContent?.inputTranscription?.text) {
            const chunk = message.serverContent.inputTranscription.text;
            setLastUserText(prev => prev + chunk);
        }

        // Live output transcription (AI translation text)
        if (message.serverContent?.outputTranscription?.text) {
            const chunk = message.serverContent.outputTranscription.text;
            setLastModelText(prev => prev + chunk);
        }

        if (message.serverContent?.turnComplete) {
            // Reset transcripts for next turn
            setTimeout(() => {
                setLastUserText('');
                setLastModelText('');
            }, 3000);
        }
    }, [playbackLoop]);

    /**
     * Start a translation session
     */
    const start = useCallback(async (targetLang) => {
        try {
            setStatus('connecting');
            setError(null);
            setSessionDuration(0);
            setLastUserText('');
            setLastModelText('');

            const apiKey = await fetchApiKey();

            const genAI = new GoogleGenAI({
                apiKey,
                httpOptions: { apiVersion: 'v1alpha' }
            });

            if (!genAI.live) {
                throw new Error('Live API not available');
            }

            if (!audioContextRef.current) {
                audioContextRef.current = createAudioContext(16000);
                playbackContextRef.current = createAudioContext(24000);
            }

            const stream = await getMicrophoneStream();
            mediaStreamRef.current = stream;

            const targetLanguage = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

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
                    systemInstruction: getInterpreterPrompt(targetLanguage),
                    inputAudioTranscription: {},
                    outputAudioTranscription: {}
                },
                callbacks: {
                    onopen: () => {
                        setIsConnected(true);
                        setStatus('listening');
                        sessionStartRef.current = Date.now();
                        durationIntervalRef.current = setInterval(() => {
                            setSessionDuration(Math.floor((Date.now() - sessionStartRef.current) / 1000));
                        }, 1000);
                    },
                    onmessage: handleMessage,
                    onerror: (e) => {
                        setError(`Connection error: ${e.message || 'Unknown'}`);
                        setStatus('error');
                    },
                    onclose: (e) => {
                        if (e.code !== 1000 && !e.wasClean) {
                            setError(`Connection closed: ${e.reason || 'Unknown'} (Code: ${e.code})`);
                            setStatus('error');
                        } else {
                            setStatus('idle');
                        }
                        setIsConnected(false);
                    }
                }
            });

            sessionRef.current = session;

            // Audio processing with analyser for visualizer
            const audioSource = audioContextRef.current.createMediaStreamSource(stream);

            // Analyser for visualizer
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            analyserRef.current = analyser;
            audioSource.connect(analyser);

            // Audio level metering loop
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const meterLoop = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length / 255;
                setAudioLevel(avg);
                animFrameRef.current = requestAnimationFrame(meterLoop);
            };
            meterLoop();

            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.value = 0;

            processor.onaudioprocess = (e) => {
                if (!sessionRef.current) return;

                // Push-to-talk: skip sending audio when muted
                if (isMicMutedRef.current) {
                    setAudioLevel(0);
                    return;
                }

                try {
                    const inputData = e.inputBuffer.getChannelData(0);

                    // Interruption detection
                    if (isPlayingRef.current) {
                        let sum = 0;
                        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                        const volume = Math.sqrt(sum / inputData.length);
                        if (volume > 0.05) {
                            activeSourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
                            activeSourcesRef.current = [];
                            audioQueueRef.current = [];
                            isPlayingRef.current = false;
                            nextPlayTimeRef.current = 0;
                            playbackLoopRunningRef.current = false;
                            setStatus('listening');
                        }
                    }

                    const pcmData = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        const s = Math.max(-1, Math.min(1, inputData[i]));
                        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }

                    const base64Audio = audioBufferToBase64(pcmData.buffer);
                    sessionRef.current.sendRealtimeInput({
                        audio: { data: base64Audio, mimeType: 'audio/pcm;rate=16000' }
                    });
                } catch (err) {
                    console.error('Audio processing error:', err);
                }
            };

            audioSource.connect(processor);
            processor.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);

            mediaRecorderRef.current = { processor, audioSource, gainNode };

        } catch (err) {
            console.error('Start error:', err);
            setError(err.message);
            setStatus('error');
            cleanup();
        }
    }, [handleMessage, playbackLoop]);

    const stop = useCallback(() => {
        cleanup();
        setStatus('idle');
        setIsConnected(false);
    }, []);

    const cleanup = useCallback(() => {
        playbackLoopRunningRef.current = false;

        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }

        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }

        if (mediaRecorderRef.current) {
            try {
                mediaRecorderRef.current.processor?.disconnect();
                mediaRecorderRef.current.gainNode?.disconnect();
                mediaRecorderRef.current.audioSource?.disconnect();
            } catch (e) { }
        }
        mediaRecorderRef.current = null;

        if (mediaStreamRef.current) {
            stopMediaStream(mediaStreamRef.current);
            mediaStreamRef.current = null;
        }

        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (playbackContextRef.current) {
            playbackContextRef.current.close();
            playbackContextRef.current = null;
        }

        audioQueueRef.current = [];
        isPlayingRef.current = false;
        nextPlayTimeRef.current = 0;
        setAudioLevel(0);
    }, []);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    // Sync ref with state for the audio processor closure
    const setMicMuted = useCallback((muted) => {
        setIsMicMuted(muted);
        isMicMutedRef.current = muted;
    }, []);

    return {
        status,
        error,
        isConnected,
        audioLevel,
        sessionDuration,
        isMicMuted,
        lastUserText,
        lastModelText,
        start,
        stop,
        setMicMuted
    };
}
