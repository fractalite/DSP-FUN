// Configuration settings for the application
const config = {
    // Groq API Configuration
    GROQ_API_KEY: '', // API key should be set via environment
    GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    GROQ_MODEL_ID: 'llama-3.3-70b-versatile'
};

// Load API key from environment if available
if (typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG.GROQ_API_KEY) {
    config.GROQ_API_KEY = ENV_CONFIG.GROQ_API_KEY;
}

// Export configuration
window.appConfig = config;
