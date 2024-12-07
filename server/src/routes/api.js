import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { GroqService } from '../services/groqService.js';

const router = express.Router();

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
router.use(apiLimiter);

// Initialize Groq service
const groqService = new GroqService(process.env.GROQ_API_KEY);

// Affirmations endpoint
router.post('/affirmations/generate', async (req, res) => {
  try {
    const { prompt, context = 'general', tone = 'positive' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const affirmation = await groqService.generateAffirmation(prompt, context, tone);
    
    res.json({
      success: true,
      affirmation,
      context,
      tone
    });
  } catch (error) {
    console.error('Affirmation generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate affirmation',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Session tracking endpoints
router.post('/sessions', async (req, res) => {
  try {
    const { duration, type, metrics } = req.body;
    
    // Since we're using browser storage, just validate and return success
    if (!duration || !type) {
      return res.status(400).json({
        success: false,
        error: 'Duration and type are required'
      });
    }

    res.json({
      success: true,
      sessionId: Date.now().toString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process session'
    });
  }
});

router.get('/sessions/stats', async (req, res) => {
  // Since we're using browser storage, this endpoint won't be needed
  res.status(200).json({
    success: true,
    message: 'Stats are managed client-side'
  });
});

export default router;
