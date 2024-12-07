import ENV from './config.js';

class AIAssistant {
    constructor() {
        this.initialized = false;
        this.backendUrl = ENV.BACKEND_URL;
        this.initPromise = this.init();
    }

    async init() {
        if (!ENV.ENABLE_AI) {
            console.log('AI features are disabled');
            return;
        }

        try {
            console.log('Initializing AI Assistant using backend:', this.backendUrl);
            
            const response = await fetch(`${this.backendUrl}/api/config`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load configuration: ${response.status}`);
            }

            const config = await response.json();
            this.initialized = true;
            console.log('AI Assistant initialized successfully');
            return config;
        } catch (error) {
            console.warn('AI Assistant initialization failed:', error);
            // Don't throw, just log the error and continue
            return null;
        }
    }

    async generateAffirmations(intention) {
        if (!ENV.ENABLE_AI || !this.initialized) {
            return {
                success: false,
                message: 'AI features are not available. Please try again later.',
                affirmations: []
            };
        }

        try {
            const response = await fetch(`${this.backendUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ intention })
            });

            if (!response.ok) {
                throw new Error(`Generation failed: ${response.status}`);
            }

            const result = await response.json();
            return {
                success: true,
                affirmations: result.affirmations || []
            };
        } catch (error) {
            console.error('Failed to generate affirmations:', error);
            return {
                success: false,
                message: 'Failed to generate affirmations. Please try again.',
                affirmations: []
            };
        }
    }
}

export default AIAssistant;
