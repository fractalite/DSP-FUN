import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;  // Set default port to 3001

// Configure CORS for development
app.use(cors({
    origin: ['http://localhost:3006', 'http://localhost:5173', 'http://localhost:3008'],
    credentials: true
}));

app.use(express.json());

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// API routes should come before static file serving
app.get('/api/config', (req, res) => {
    const config = {
        modelId: process.env.GROQ_MODEL_ID || 'llama-3.3-70b-versatile',
        enableAI: process.env.ENABLE_AI === 'true',
        apiKeyExists: !!process.env.GROQ_API_KEY
    };
    console.log('Sending config:', config);
    res.json(config);
});

app.post('/api/generate', async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('API key not configured');
        }

        const { intention } = req.body;
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'Generate exactly 10 personal affirmations in present tense. Format as a numbered list (1-10). Each line should start with a number and period. Each affirmation should be 10-15 words.'
                    },
                    {
                        role: 'user',
                        content: `Generate 10 empowering affirmations for: ${intention}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const data = await response.json();
        const affirmations = data.choices[0].message.content;
        res.json({ affirmations });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment variables loaded:', {
        MODEL_ID: process.env.GROQ_MODEL_ID,
        API_KEY_EXISTS: !!process.env.GROQ_API_KEY,
        ENABLE_AI: process.env.ENABLE_AI
    });
});
