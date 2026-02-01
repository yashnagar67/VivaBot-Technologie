/**
 * Audio utility functions for voice assistant
 */

/**
 * Request microphone permission and get audio stream
 * @returns {Promise<MediaStream>}
 */
export async function getMicrophoneStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        return stream;
    } catch (error) {
        console.error('Microphone access error:', error);
        throw new Error('Microphone permission denied or not available');
    }
}

/**
 * Convert audio buffer to base64 PCM format
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function audioBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convert base64 to audio buffer for playback
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
export function base64ToAudioBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Create audio context for playback
 * @param {number} sampleRate - Sample rate (default 24000 for playback, 16000 for recording)
 * @returns {AudioContext}
 */
export function createAudioContext(sampleRate = 16000) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    return new AudioContextClass({ sampleRate });
}

/**
 * Play audio buffer through Web Audio API
 * @param {AudioContext} audioContext
 * @param {ArrayBuffer} audioData
 * @returns {Promise<void>}
 */
export async function playAudioBuffer(audioContext, audioData) {
    try {
        // Convert raw PCM to AudioBuffer
        const audioBuffer = audioContext.createBuffer(
            1, // mono
            audioData.byteLength / 2, // 16-bit = 2 bytes per sample
            audioContext.sampleRate // Use the context's sample rate (24000)
        );

        const channelData = audioBuffer.getChannelData(0);
        const view = new DataView(audioData);

        // Convert 16-bit PCM to float32
        for (let i = 0; i < channelData.length; i++) {
            const int16 = view.getInt16(i * 2, true); // little-endian
            channelData[i] = int16 / 32768.0; // normalize to -1.0 to 1.0
        }

        // Create gain node for smooth volume control
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 1.0;

        // Play the audio
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        return new Promise((resolve) => {
            source.onended = resolve;
            source.start(0);
        });
    } catch (error) {
        console.error('Audio playback error:', error);
        throw error;
    }
}

/**
 * Stop all tracks in a media stream
 * @param {MediaStream} stream
 */
export function stopMediaStream(stream) {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}
