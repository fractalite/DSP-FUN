import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.get('/config', (req, res) => {
    const config = {
        modelId: process.env.GROQ_MODEL_ID || 'llama-3.3-70b-versatile',
        enableAI: process.env.ENABLE_AI === 'true',
        apiKeyExists: !!process.env.GROQ_API_KEY
    };
    console.log('Sending config:', config);
    res.json(config);
});

router.post('/generate', async (req, res) => {
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
        console.log('API Response:', {
            status: response.status,
            ok: response.ok,
            data: data
        });
        
        // Check for rate limit error
        if (!response.ok) {
            const errorMessage = data.error?.message || 'Error from AI service';
            if (errorMessage.includes('rate limit exceeded')) {
                return res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded. Please try again in about an hour.',
                    retryAfter: 3600, // 1 hour in seconds
                    affirmations: []
                });
            }
            throw new Error(errorMessage);
        }
        
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from AI service');
        }

        // Parse the numbered list into an array
        const content = data.choices[0].message.content;
        const affirmations = content
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\d+\.\s*/, '').trim());

        res.json({
            success: true,
            affirmations
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            affirmations: []
        });
    }
});

export { router };
