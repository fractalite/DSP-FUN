// Configuration settings for the application
const config = {
    // Groq API Configuration
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    GROQ_API_URL: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
    GROQ_MODEL_ID: process.env.GROQ_MODEL_ID || 'llama-3.3-70b-versatile'
};

// Export configuration
window.appConfig = config;
