import { ClientRetryHandler } from '../utils/retryUtils.js';

export class AffirmationService {
  constructor(apiUrl = 'http://localhost:3001/api/v1') {
    this.apiUrl = apiUrl;
    this.storageKey = 'deepr_affirmations';
    this.retryHandler = new ClientRetryHandler({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000
    });
  }

  // Available contexts for affirmations
  static CONTEXTS = {
    MEDITATION: 'meditation',
    WORKOUT: 'workout',
    PRODUCTIVITY: 'productivity',
    CREATIVITY: 'creativity',
    SLEEP: 'sleep',
    CONFIDENCE: 'confidence',
    HEALING: 'healing',
    RELATIONSHIPS: 'relationships',
    GENERAL: 'general'
  };

  // Available tones for affirmations
  static TONES = {
    POSITIVE: 'positive',
    CALM: 'calm',
    ENERGETIC: 'energetic',
    CONFIDENT: 'confident',
    GENTLE: 'gentle'
  };

  async generateAffirmation(prompt, context = AffirmationService.CONTEXTS.GENERAL, tone = AffirmationService.TONES.POSITIVE) {
    return this.retryHandler.execute(
      async () => {
        const response = await fetch(`${this.apiUrl}/affirmations/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt, context, tone })
        });

        if (!response.ok) {
          const error = await response.json();
          const errorObj = new Error(error.message || 'Failed to generate affirmation');
          errorObj.response = response;
          throw errorObj;
        }

        const data = await response.json();
        
        // Store the generated affirmation
        this.saveAffirmation({
          text: data.affirmation,
          context,
          tone,
          timestamp: new Date().toISOString(),
          prompt
        });

        return data.affirmation;
      },
      'affirmation generation'
    ).catch(error => {
      console.error('Affirmation generation error:', error);
      // Try to get a cached affirmation for the same context if available
      const cached = this.getStoredAffirmations(context)[0];
      if (cached) {
        console.log('Using cached affirmation as fallback');
        return cached.text;
      }
      throw new Error('Failed to generate affirmation and no cached fallback available');
    });
  }

  saveAffirmation(affirmation) {
    try {
      const stored = this.getStoredAffirmations();
      stored.unshift(affirmation);
      
      // Keep only the last 50 affirmations
      if (stored.length > 50) {
        stored.pop();
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(stored));
    } catch (error) {
      console.error('Error saving affirmation:', error);
    }
  }

  getStoredAffirmations(context = null) {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const affirmations = stored ? JSON.parse(stored) : [];
      
      // If context is provided, filter by context
      return context 
        ? affirmations.filter(a => a.context === context)
        : affirmations;
    } catch (error) {
      console.error('Error retrieving affirmations:', error);
      return [];
    }
  }

  clearStoredAffirmations() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing affirmations:', error);
    }
  }
}
