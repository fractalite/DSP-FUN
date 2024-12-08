// Configuration settings for the application
const ENV = {
    // API Configuration
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001/api'
        : 'https://api.deepr.love/api',
    
    // Backend URL - using Netlify Functions
    BACKEND_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : 'https://api.deepr.love',
    
    // Feature flags
    ENABLE_AI: window.__ENABLE_AI__ !== 'false',
    ENABLE_VOICE_RECORDING: true,
    ENABLE_BINAURAL_BEATS: true,
    ENABLE_AFFIRMATIONS: true,
    
    // Environment
    IS_PRODUCTION: window.location.hostname === 'deepr.love',
    
    // Storage keys
    STORAGE_KEYS: {
        AFFIRMATIONS: 'deepr_affirmations',
        SESSIONS: 'deepr_sessions',
        PREFERENCES: 'deepr_preferences'
    }
};

// Log configuration status
console.log('Config initialized:', {
    API_URL: ENV.API_URL,
    BACKEND_URL: ENV.BACKEND_URL,
    ENABLE_AI: ENV.ENABLE_AI,
    IS_PRODUCTION: ENV.IS_PRODUCTION,
    HOSTNAME: window.location.hostname
});

// Export configuration
window.ENV = ENV;
export default ENV;
