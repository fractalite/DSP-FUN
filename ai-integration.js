class AIAssistant {
    constructor() {
        this.initialized = false;
        this.backendUrl = this.getBackendUrl();
        this.initPromise = this.init();
    }

    getBackendUrl() {
        // Use production URL when not in development
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3001'
            : 'https://deepr-love-backend.netlify.app';
    }

    async init() {
        try {
            console.log('Initializing AI Assistant, fetching config from:', `${this.backendUrl}/api/config`);
            
            const response = await fetch(`${this.backendUrl}/api/config`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Config response not OK:', response.status, errorText);
                throw new Error(`Failed to load configuration: ${response.status}`);
            }

            const config = await response.json();
            console.log('Received config:', config);

            if (!config.apiKeyExists) {
                throw new Error('API key not configured on server');
            }

            this.MODEL_ID = config.modelId;
            this.initialized = true;
            console.log('AI Assistant successfully initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize AI Assistant:', error);
            throw error;
        }
    }

    async generateAffirmations(intention) {
        try {
            await this.initPromise;

            if (!this.initialized) {
                throw new Error('AI Assistant not initialized');
            }

            console.log('Sending intention to server:', intention);

            const response = await fetch(`${this.backendUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ intention })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to generate affirmations');
            }

            const data = await response.json();
            console.log('Full server response:', JSON.stringify(data, null, 2));

            if (!data.affirmations) {
                throw new Error('No affirmations received from server');
            }

            return data;
        } catch (error) {
            console.error('Error in AI Assistant:', error);
            throw error;
        }
    }
}

export default AIAssistant;
