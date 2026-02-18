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

// Popular Gemini native audio voices (3F, 2M)
export const VOICES = [
    { id: 'Kore', label: 'Kore', gender: 'F', desc: 'Clear & warm' },
    { id: 'Zephyr', label: 'Zephyr', gender: 'F', desc: 'Bright & breezy' },
    { id: 'Aoede', label: 'Aoede', gender: 'F', desc: 'Thoughtful & engaging' },
    { id: 'Puck', label: 'Puck', gender: 'M', desc: 'Upbeat & playful' },
    { id: 'Charon', label: 'Charon', gender: 'M', desc: 'Deep & calm' },
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
    const [previewingVoice, setPreviewingVoice] = useState(null);

    // Live transcription — only shows CURRENT turn's text
    const [lastUserText, setLastUserText] = useState('');
    const [lastModelText, setLastModelText] = useState('');

    // Refs for performant chunk accumulation (no re-render per chunk)
    const userTextRef = useRef('');
    const modelTextRef = useRef('');
    const textFlushRef = useRef(null);    // rAF handle for batched state flush
    const clearTimerRef = useRef(null);   // single timeout for delayed clear
    const turnActiveRef = useRef(false);  // tracks whether a turn is in progress
    const silenceCounterRef = useRef(0);  // frames of silence to send after PTT release

    // ── Perf timing refs ──
    const perfHoldStartRef = useRef(0);
    const perfReleaseRef = useRef(0);
    const perfFirstAudioRef = useRef(false);
    const perfFirstInputTxRef = useRef(false);
    const perfFirstOutputTxRef = useRef(false);

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

    // Batched state flush — coalesces rapid chunks into a single render
    const flushText = useCallback(() => {
        textFlushRef.current = null;
        setLastUserText(userTextRef.current);
        setLastModelText(modelTextRef.current);
    }, []);

    const scheduleFlush = useCallback(() => {
        if (!textFlushRef.current) {
            textFlushRef.current = requestAnimationFrame(flushText);
        }
    }, [flushText]);

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
        const now = performance.now();

        // Handle interruption
        if (message.serverContent?.interrupted) {
            console.log('[LL-PERF] ⚡ Interrupted by user');
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
                    if (!perfFirstAudioRef.current && perfReleaseRef.current) {
                        perfFirstAudioRef.current = true;
                        const delta = now - perfReleaseRef.current;
                        console.log(`[LL-PERF] 🔊 First model AUDIO received: ${delta.toFixed(0)}ms after release`);
                    }
                    const audioData = base64ToAudioBuffer(part.inlineData.data);
                    audioQueueRef.current.push(audioData);
                }
            }

            if (audioQueueRef.current.length > 0 && !playbackLoopRunningRef.current) {
                playbackLoop();
            }
        }

        // ── Live transcription (current turn only) ──

        // Input transcription — new chunk from user speech
        if (message.serverContent?.inputTranscription?.text) {
            if (!perfFirstInputTxRef.current && perfReleaseRef.current) {
                perfFirstInputTxRef.current = true;
                const delta = now - perfReleaseRef.current;
                console.log(`[LL-PERF] 📝 First INPUT transcription: ${delta.toFixed(0)}ms after release — "${message.serverContent.inputTranscription.text.slice(0, 50)}"`);
            }
            // If a new turn is starting, wipe previous text instantly
            if (!turnActiveRef.current) {
                turnActiveRef.current = true;
                if (clearTimerRef.current) {
                    clearTimeout(clearTimerRef.current);
                    clearTimerRef.current = null;
                }
                userTextRef.current = '';
                modelTextRef.current = '';
            }
            userTextRef.current += message.serverContent.inputTranscription.text;
            scheduleFlush();
        }

        // Output transcription — AI translation text
        if (message.serverContent?.outputTranscription?.text) {
            if (!perfFirstOutputTxRef.current && perfReleaseRef.current) {
                perfFirstOutputTxRef.current = true;
                const delta = now - perfReleaseRef.current;
                console.log(`[LL-PERF] 🌐 First OUTPUT transcription: ${delta.toFixed(0)}ms after release — "${message.serverContent.outputTranscription.text.slice(0, 50)}"`);
            }
            modelTextRef.current += message.serverContent.outputTranscription.text;
            scheduleFlush();
        }

        // Turn complete — keep text visible briefly, then clear for next turn
        if (message.serverContent?.turnComplete) {
            if (perfReleaseRef.current) {
                const totalDelta = now - perfReleaseRef.current;
                const holdDelta = perfReleaseRef.current - perfHoldStartRef.current;
                console.log(`[LL-PERF] ✅ Turn COMPLETE: ${totalDelta.toFixed(0)}ms after release (held for ${holdDelta.toFixed(0)}ms)`);
                console.log('[LL-PERF] ──────────────────────────────');
            }
            turnActiveRef.current = false;
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
            clearTimerRef.current = setTimeout(() => {
                clearTimerRef.current = null;
                userTextRef.current = '';
                modelTextRef.current = '';
                setLastUserText('');
                setLastModelText('');
            }, 4000);
        }
    }, [playbackLoop, scheduleFlush]);

    /**
     * Start a translation session
     */
    const start = useCallback(async (targetLang, voiceName = 'Kore') => {
        try {
            setStatus('connecting');
            setError(null);
            setSessionDuration(0);
            setLastUserText('');
            setLastModelText('');
            userTextRef.current = '';
            modelTextRef.current = '';
            turnActiveRef.current = false;
            if (clearTimerRef.current) { clearTimeout(clearTimerRef.current); clearTimerRef.current = null; }
            if (textFlushRef.current) { cancelAnimationFrame(textFlushRef.current); textFlushRef.current = null; }

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
                                voiceName: voiceName
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

                const bufLen = e.inputBuffer.getChannelData(0).length;

                // Push-to-talk: when muted, send trailing silence to trigger VAD
                if (isMicMutedRef.current) {
                    if (silenceCounterRef.current > 0) {
                        silenceCounterRef.current--;
                        try {
                            // Send a silent PCM frame so Gemini's VAD detects end-of-speech
                            const silentPcm = new Int16Array(bufLen); // all zeros = silence
                            const base64Audio = audioBufferToBase64(silentPcm.buffer);
                            sessionRef.current.sendRealtimeInput({
                                audio: { data: base64Audio, mimeType: 'audio/pcm;rate=16000' }
                            });
                        } catch (err) { /* ignore */ }
                    }
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

        // Clean up transcript timers
        if (clearTimerRef.current) { clearTimeout(clearTimerRef.current); clearTimerRef.current = null; }
        if (textFlushRef.current) { cancelAnimationFrame(textFlushRef.current); textFlushRef.current = null; }
        userTextRef.current = '';
        modelTextRef.current = '';
        turnActiveRef.current = false;
    }, []);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    // Sync ref with state for the audio processor closure
    const setMicMuted = useCallback((muted) => {
        const wasMuted = isMicMutedRef.current;
        setIsMicMuted(muted);
        isMicMutedRef.current = muted;

        if (wasMuted && !muted) {
            // PTT pressed (muted → unmuted)
            perfHoldStartRef.current = performance.now();
            perfFirstAudioRef.current = false;
            perfFirstInputTxRef.current = false;
            perfFirstOutputTxRef.current = false;
            console.log('[LL-PERF] 🎤 PTT PRESSED — recording started');
        }

        // PTT released (unmuted → muted): queue silence frames to trigger VAD
        // 3 frames × 4096 samples at 16kHz ≈ 768ms of silence
        if (!wasMuted && muted) {
            perfReleaseRef.current = performance.now();
            const holdDuration = perfReleaseRef.current - perfHoldStartRef.current;
            console.log(`[LL-PERF] ✋ PTT RELEASED — held for ${holdDuration.toFixed(0)}ms, sending 3 silence frames`);
            silenceCounterRef.current = 3;
        }
    }, []);

    // ── Voice preview (static audio files) ──
    const previewAudioRef = useRef(null);

    const previewVoice = useCallback((voiceId) => {
        if (previewingVoice) {
            // Stop current preview
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current = null;
            }
            setPreviewingVoice(null);
            return;
        }

        setPreviewingVoice(voiceId);
        const audio = new Audio(`/voices/${voiceId.toLowerCase()}.wav`);
        previewAudioRef.current = audio;

        audio.onended = () => {
            setPreviewingVoice(null);
            previewAudioRef.current = null;
        };

        audio.onerror = () => {
            console.warn(`Voice preview not found: /voices/${voiceId.toLowerCase()}.wav`);
            setPreviewingVoice(null);
            previewAudioRef.current = null;
        };

        audio.play().catch(() => {
            setPreviewingVoice(null);
            previewAudioRef.current = null;
        });
    }, [previewingVoice]);

    return {
        status,
        error,
        isConnected,
        audioLevel,
        sessionDuration,
        isMicMuted,
        lastUserText,
        lastModelText,
        previewingVoice,
        start,
        stop,
        setMicMuted,
        previewVoice
    };
}
