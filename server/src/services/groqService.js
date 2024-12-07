import { RetryHandler } from '../utils/retryUtils.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class GroqService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 8000,
      retryableErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'RATE_LIMIT_EXCEEDED',
        '429',
        '503',
        '504'
      ]
    });
  }

  async generateAffirmation(prompt, context = 'general', tone = 'positive') {
    return this.retryHandler.execute(
      async () => {
        const systemPrompt = this.getSystemPrompt(context, tone);
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 150,
            top_p: 1,
            stream: false
          })
        });

        if (!response.ok) {
          const error = await response.json();
          const errorMessage = error.message || 'Failed to generate affirmation';
          const errorObj = new Error(errorMessage);
          errorObj.status = response.status;
          throw errorObj;
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
      },
      'Groq API affirmation generation'
    ).catch(error => {
      console.error('Groq API Error:', error);
      throw new Error('Failed to generate affirmation after retries');
    });
  }

  getSystemPrompt(context, tone) {
    // Base prompt structure for all affirmations
    const basePrompt = `You are an AI specialized in generating personalized affirmations.
Create affirmations that are:
- Personal and empowering
- Specific to the user's needs
- Present-tense focused
- Positive and uplifting
- Concise (1-2 sentences)
- Realistic and achievable`;

    // Context-specific prompts
    const contextPrompts = {
      meditation: `${basePrompt}
Focus on:
- Inner peace and mindfulness
- Present moment awareness
- Connection with breath and body
- Mental clarity and calmness
- Self-acceptance and compassion`,

      workout: `${basePrompt}
Focus on:
- Physical strength and endurance
- Body awareness and capability
- Athletic achievement and progress
- Health and vitality
- Determination and persistence`,

      productivity: `${basePrompt}
Focus on:
- Focus and concentration
- Task completion and efficiency
- Goal achievement
- Time management
- Mental clarity and organization`,

      creativity: `${basePrompt}
Focus on:
- Artistic expression and flow
- Innovation and originality
- Creative confidence
- Artistic vision
- Imaginative freedom`,

      sleep: `${basePrompt}
Focus on:
- Relaxation and peace
- Natural sleep rhythms
- Mental and physical rest
- Evening wind-down
- Restful night's sleep`,

      confidence: `${basePrompt}
Focus on:
- Self-worth and self-acceptance
- Personal power
- Social confidence
- Leadership qualities
- Inner strength`,

      healing: `${basePrompt}
Focus on:
- Physical and emotional wellbeing
- Natural healing processes
- Body-mind connection
- Recovery and renewal
- Health restoration`,

      relationships: `${basePrompt}
Focus on:
- Connection and empathy
- Communication skills
- Boundaries and self-respect
- Love and compassion
- Social harmony`,

      general: `${basePrompt}
Focus on:
- Overall wellbeing
- Personal growth
- Life balance
- Positive mindset
- Daily motivation`
    };

    // Tone modifiers
    const toneModifiers = {
      positive: '\nMaintain an optimistic and encouraging tone.',
      calm: '\nUse soothing and peaceful language.',
      energetic: '\nUse dynamic and motivating language.',
      confident: '\nUse strong and assertive language.',
      gentle: '\nUse gentle and nurturing language.'
    };

    // Get the context-specific prompt, defaulting to general if not found
    const contextPrompt = contextPrompts[context] || contextPrompts.general;
    const toneModifier = toneModifiers[tone] || toneModifiers.positive;

    return `${contextPrompt}${toneModifier}`;
  }
}
