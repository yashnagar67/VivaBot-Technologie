// Environment configuration
export const config = {
    // Backend URL - change this to your deployed backend URL in production
    backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',

    // Gemini Live API configuration
    gemini: {
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        audioConfig: {
            inputSampleRate: 16000,
            outputSampleRate: 24000,
            channels: 1,
            bitDepth: 16
        }
    }
};
