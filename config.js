// Configuration settings for the application
const ENV = {
    // API Configuration
    GROQ_API_KEY: window.__GROQ_API_KEY__,
    GROQ_API_URL: window.__GROQ_API_URL__ || 'https://api.groq.com/openai/v1/chat/completions',
    GROQ_MODEL_ID: window.__GROQ_MODEL_ID__ || 'llama-3.3-70b-versatile',
    
    // Feature flags
    ENABLE_AI: window.__ENABLE_AI__ !== 'false',
    ENABLE_VOICE_RECORDING: true,
    ENABLE_BINAURAL_BEATS: true,
    ENABLE_AFFIRMATIONS: true
};

// Log configuration status
console.log('Config initialized:', {
    API_KEY_EXISTS: !!ENV.GROQ_API_KEY,
    API_KEY_LENGTH: ENV.GROQ_API_KEY ? ENV.GROQ_API_KEY.length : 0,
    API_URL: ENV.GROQ_API_URL,
    MODEL_ID: ENV.GROQ_MODEL_ID,
    ENABLE_AI: ENV.ENABLE_AI
});

// Export configuration
window.ENV = ENV;
export default ENV;
