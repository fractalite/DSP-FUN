// Configuration settings for the application
const config = {
    // Add your Groq API key here or leave empty to use template-based generation
    GROQ_API_KEY: '',  // Example: 'gsk_your_api_key'
    
    // API configuration
    GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    GROQ_MODEL_ID: 'llama-3.3-70b-versatile'
};

// Export configuration
window.appConfig = config;
