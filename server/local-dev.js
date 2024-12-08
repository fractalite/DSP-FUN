import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handler as netlifyHandler } from '../netlify/functions/api.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.DEV_PORT || 9999;

// Development server CORS with more permissive options for local dev
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3001',
            'http://localhost:5173',
            'http://localhost:8888'
        ];
        callback(null, allowedOrigins.includes(origin) || !origin); // Allow localhost development
    },
    credentials: true
}));

app.use(express.json());

// Enhanced request logging
app.use((req, res, next) => {
    console.log(`[DEV ${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Netlify Functions router with better error context
app.all('/.netlify/functions/api/*', async (req, res) => {
    try {
        const functionEvent = {
            path: req.path,
            httpMethod: req.method,
            headers: req.headers,
            body: JSON.stringify(req.body),
            queryStringParameters: req.query,
            isBase64Encoded: false
        };

        console.log('[DEV] Function event:', functionEvent);

        const response = await netlifyHandler(functionEvent);

        // Log function response for debugging
        console.log('[DEV] Function response:', {
            statusCode: response.statusCode,
            headers: response.headers,
            bodyLength: response.body?.length
        });

        res.status(response.statusCode)
           .set(response.headers || {})
           .send(response.isBase64Encoded ? Buffer.from(response.body, 'base64') : response.body);
    } catch (error) {
        console.error('[DEV] Function Error:', error);
        res.status(500).json({
            error: 'Function execution failed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Development Server Error:', err);
    res.status(500).json({
        error: 'Development Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server with environment info
app.listen(PORT, () => {
    console.log(`Development server running on http://localhost:${PORT}`);
    console.log('Development Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        MODEL_ID: process.env.GROQ_MODEL_ID,
        API_KEY_EXISTS: !!process.env.GROQ_API_KEY,
        ENABLE_AI: process.env.ENABLE_AI
    });
});
