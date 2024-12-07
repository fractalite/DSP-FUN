// Initialize environment variables
window.__GROQ_API_KEY__ = process.env.GROQ_API_KEY;
window.__GROQ_API_URL__ = process.env.VITE_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
window.__GROQ_MODEL_ID__ = process.env.VITE_MODEL_ID || 'llama-3.3-70b-versatile';
window.__ENABLE_AI__ = process.env.VITE_ENABLE_AI !== 'false';
