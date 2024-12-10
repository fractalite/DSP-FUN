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
        const interactionEvents = [
            'click', 'touchstart', 'keydown', 
            'mousedown', 'pointerdown', 
            'play', 'pause', 'volumechange'
        ];

        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, this.handleUserInteraction, { 
                once: false,  // Keep listener active
                passive: true 
            });
        });

        console.debug('AudioOptimizer: Interaction listeners setup complete');
    }

    async handleUserInteraction(event) {
        this.metrics.userInteractions++;
        
        if (!this.userInteractionReceived) {
            console.debug('AudioOptimizer: First user interaction detected', {
                eventType: event.type,
                timestamp: new Date().toISOString()
            });

            this.userInteractionReceived = true;
            
            try {
                await this.initialize();
            } catch (error) {
                console.error('AudioOptimizer: Initialization failed after user interaction', error);
                this.handleError(error);
            }
        }
    }

    async initialize() {
        console.log('[AudioOptimizer] Initializing...');
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('[AudioOptimizer] AudioContext created:', this.audioContext);
            }
            if (this.audioContext.state === 'suspended') {
                console.log('[AudioOptimizer] Resuming AudioContext...');
                await this.audioContext.resume();
                console.log('[AudioOptimizer] AudioContext resumed:', this.audioContext.state);
            }
        } catch (err) {
            console.error('[AudioOptimizer] Error initializing AudioContext:', err);
        }
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
