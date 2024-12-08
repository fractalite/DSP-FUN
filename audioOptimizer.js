class AudioOptimizer {
    constructor() {
        this.audioContext = null;
        this.initialized = false;
        this.initializationPromise = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.userInteractionReceived = false;
        
        // Track initialization attempts and errors
        this.metrics = {
            initAttempts: 0,
            lastInitAttempt: null,
            errors: [],
            resumeAttempts: 0,
            userInteractions: 0
        };

        // Bind methods
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleUserInteraction = this.handleUserInteraction.bind(this);
        
        // Set up event listeners
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        this.setupInteractionListeners();
        
        // Debug logging
        console.debug('AudioOptimizer: Constructed and waiting for user interaction');
    }

    setupInteractionListeners() {
        const interactions = ['click', 'touchstart', 'keydown'];
        
        const handler = async (event) => {
            // Only process if it's a direct user interaction
            if (event.isTrusted && !this.userInteractionReceived) {
                this.userInteractionReceived = true;
                this.metrics.userInteractions++;
                console.debug('AudioOptimizer: User interaction received');
                
                try {
                    await this.initialize();
                } catch (error) {
                    console.error('AudioOptimizer: Failed to initialize after user interaction:', error);
                }
            }
        };

        interactions.forEach(event => {
            document.addEventListener(event, handler, { once: false });
        });

        // Store handlers for cleanup
        this.handlers = interactions.map(event => ({ event, handler }));
    }

    async initialize() {
        if (this.initialized) {
            console.debug('AudioOptimizer: Already initialized');
            return;
        }
        
        if (!this.userInteractionReceived) {
            console.debug('AudioOptimizer: Waiting for user interaction before initialization');
            return;
        }

        // Create promise only once
        if (!this.initializationPromise) {
            console.debug('AudioOptimizer: Starting initialization');
            this.initializationPromise = new Promise(async (resolve) => {
                try {
                    this.metrics.initAttempts++;
                    this.metrics.lastInitAttempt = Date.now();

                    if (!this.audioContext) {
                        console.debug('AudioOptimizer: Creating new AudioContext');
                        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    }

                    // Ensure context is running
                    if (this.audioContext.state !== 'running') {
                        console.debug('AudioOptimizer: Resuming AudioContext');
                        this.metrics.resumeAttempts++;
                        await this.audioContext.resume();
                    }

                    this.initialized = true;
                    console.debug('AudioOptimizer: Successfully initialized');
                    resolve();
                } catch (error) {
                    console.error('AudioOptimizer: Initialization error:', error);
                    this.handleError(error);
                    
                    // Retry if under max attempts
                    if (this.retryCount < this.maxRetries) {
                        this.retryCount++;
                        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
                        console.debug(`AudioOptimizer: Retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
                        setTimeout(() => this.initialize(), delay);
                    } else {
                        console.error('AudioOptimizer: Max retry attempts reached');
                        resolve(); // Resolve anyway to prevent hanging
                    }
                }
            });
        }

        return this.initializationPromise;
    }

    handleError(error) {
        const errorInfo = {
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack,
            context: {
                state: this.audioContext?.state,
                initialized: this.initialized,
                retryCount: this.retryCount,
                userInteractionReceived: this.userInteractionReceived
            }
        };
        
        this.metrics.errors.push(errorInfo);
        console.error('AudioOptimizer Error:', errorInfo);
    }

    cleanup() {
        if (this.handlers) {
            this.handlers.forEach(({ event, handler }) => {
                document.removeEventListener(event, handler);
            });
            this.handlers = null;
        }
    }

    handleVisibilityChange() {
        if (!this.audioContext) return;
        
        if (document.hidden) {
            console.debug('AudioOptimizer: Page hidden, suspending AudioContext');
            this.audioContext.suspend();
        } else if (this.initialized) {
            console.debug('AudioOptimizer: Page visible, resuming AudioContext');
            this.audioContext.resume();
        }
    }

    getAudioContext() {
        return this.audioContext;
    }

    isInitialized() {
        return this.initialized;
    }

    getMetrics() {
        return {
            ...this.metrics,
            audioContextState: this.audioContext?.state,
            initialized: this.initialized,
            retryCount: this.retryCount
        };
    }
}

export default AudioOptimizer;
