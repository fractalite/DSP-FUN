class AudioOptimizer {
    constructor() {
        this.audioContext = null;
        this.initialized = false;
        this.initializationPromise = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        // Track initialization attempts and errors
        this.metrics = {
            initAttempts: 0,
            lastInitAttempt: null,
            errors: [],
            resumeAttempts: 0
        };

        // Bind methods
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    async initialize() {
        if (this.initialized) return;
        
        // Create promise only once
        if (!this.initializationPromise) {
            this.initializationPromise = new Promise((resolve) => {
                const initAudio = async () => {
                    try {
                        this.metrics.initAttempts++;
                        this.metrics.lastInitAttempt = Date.now();

                        if (!this.audioContext) {
                            this.audioContext = new AudioContext();
                        }

                        // Ensure context is running
                        if (this.audioContext.state !== 'running') {
                            this.metrics.resumeAttempts++;
                            await this.audioContext.resume();
                        }

                        this.initialized = true;
                        this.cleanup();
                        resolve();
                    } catch (error) {
                        this.handleError(error);
                        
                        // Retry if under max attempts
                        if (this.retryCount < this.maxRetries) {
                            this.retryCount++;
                            setTimeout(initAudio, this.retryDelay * Math.pow(2, this.retryCount - 1));
                        } else {
                            this.cleanup();
                            resolve(); // Resolve anyway to prevent hanging
                        }
                    }
                };

                // Set up interaction listeners
                this.setupInteractionListeners(initAudio);
            });
        }

        return this.initializationPromise;
    }

    setupInteractionListeners(initCallback) {
        const interactions = ['click', 'touchstart', 'keydown'];
        const handler = (event) => {
            // Only process if it's a direct user interaction
            if (event.isTrusted) {
                initCallback();
                this.cleanup();
            }
        };

        interactions.forEach(event => {
            document.addEventListener(event, handler, { once: true });
        });

        // Store handlers for cleanup
        this.handlers = interactions.map(event => ({ event, handler }));
    }

    cleanup() {
        if (this.handlers) {
            this.handlers.forEach(({ event, handler }) => {
                document.removeEventListener(event, handler);
            });
            this.handlers = null;
        }
    }

    handleError(error) {
        this.metrics.errors.push({
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack,
            retryCount: this.retryCount
        });

        // Keep only last 10 errors
        if (this.metrics.errors.length > 10) {
            this.metrics.errors.shift();
        }

        console.error('AudioOptimizer Error:', error);
    }

    handleVisibilityChange() {
        if (this.audioContext && document.visibilityState === 'visible') {
            this.audioContext.resume().catch(error => {
                this.handleError(error);
            });
        }
    }

    async suspend() {
        if (this.audioContext && this.audioContext.state === 'running') {
            try {
                await this.audioContext.suspend();
            } catch (error) {
                this.handleError(error);
            }
        }
    }

    getMetrics() {
        return {
            initialized: this.initialized,
            context: this.audioContext ? {
                state: this.audioContext.state,
                sampleRate: this.audioContext.sampleRate,
                baseLatency: this.audioContext.baseLatency
            } : null,
            metrics: {
                ...this.metrics,
                retryCount: this.retryCount
            }
        };
    }

    destroy() {
        this.cleanup();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.audioContext) {
            this.audioContext.close().catch(error => {
                this.handleError(error);
            });
        }
    }
}

export default AudioOptimizer;
