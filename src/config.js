// Environment configuration
export const config = {
    // Backend URL - change this to your deployed backend URL in production
    backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',

    // Gemini Live API configuration
    gemini: {
        model: 'gemini-3.1-flash-live-preview',
        audioConfig: {
            inputSampleRate: 16000,
            outputSampleRate: 24000,
            channels: 1,
            bitDepth: 16
        }
    }
};
