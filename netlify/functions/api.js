import express from 'express';
import serverless from 'serverless-http';
import { rateLimit } from 'express-rate-limit';
import { GroqService } from '../../server/src/services/groqService.js';

const app = express();
const IS_DEV = process.env.NODE_ENV === 'development';

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[API Error]', {
    error: err.message,
    stack: IS_DEV ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(err.status || 500).json({
    error: IS_DEV ? err.message : 'Internal server error',
    requestId: req.headers['x-request-id']
  });
});

// Parse JSON bodies
app.use(express.json());

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// Initialize Groq service
const groqService = new GroqService(process.env.GROQ_API_KEY);

// Health check endpoint
app.get('/.netlify/functions/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Config endpoint
app.get('/.netlify/functions/api/config', (req, res, next) => {
  try {
    res.json({
      enableAI: process.env.ENABLE_AI === 'true',
      modelId: process.env.GROQ_MODEL_ID,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Affirmations endpoint
app.post('/.netlify/functions/api/generate', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const affirmation = await groqService.generateAffirmation(prompt);
    res.json({ affirmation });
  } catch (error) {
    next(error);
  }
});

// Export the serverless function
export const handler = serverless(app);
