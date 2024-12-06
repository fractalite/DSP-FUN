class AIAssistant {
    constructor() {
        // Check if API key is configured
        if (!window.appConfig?.GROQ_API_KEY) {
            console.warn('GROQ_API_KEY not found in config. AI features will be disabled.');
        }
        this.API_KEY = window.appConfig?.GROQ_API_KEY;
        this.API_URL = window.appConfig?.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
        this.MODEL_ID = window.appConfig?.GROQ_MODEL_ID || 'llama-3.3-70b-versatile';
    }

    async generateAffirmations(category, intention) {
        // If no API key is configured, return null to trigger template fallback
        if (!this.API_KEY) {
            console.warn('No API key configured. Using template fallback.');
            return null;
        }

        const prompt = `Generate 5 powerful, personalized affirmations for the category "${category}" focused on the intention "${intention}". 
        Make them empowering, positive, and in first person present tense.
        Format each affirmation on a new line.
        Keep them concise but impactful.`;

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.MODEL_ID,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            if (!response.ok) {
                throw new Error('AI API request failed');
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('AI Generation Error:', error);
            return null;
        }
    }
}

// Export the class
window.AIAssistant = AIAssistant;
