import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as apiRoutes } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:3006',
        'http://localhost:3007',
        'http://localhost:5173',
        'http://localhost:3008',
        'http://localhost:9999',  // Development server
        'http://localhost:4000'   // Vite development server
    ],
    credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// API routes
app.use('/api', apiRoutes);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Main server running on http://localhost:${PORT}`);
    console.log('Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        MODEL_ID: process.env.GROQ_MODEL_ID,
        API_KEY_EXISTS: !!process.env.GROQ_API_KEY,
        ENABLE_AI: process.env.ENABLE_AI
    });
});
