import ENV from './config.js';

const DEBUG = ENV.IS_PRODUCTION ? false : true;

class AIAssistant {
    constructor() {
        this.initialized = false;
        this.apiUrl = ENV.API_URL;
        this.debug = DEBUG;
        
        // Circuit breaker configuration
        this.circuitBreaker = {
            failureCount: 0,
            lastFailure: null,
            isOpen: false,
            threshold: 5,
            resetTimeout: 30000 // 30 seconds
        };

        // Performance metrics
        this.metrics = {
            requests: {
                total: 0,
                successful: 0,
                failed: 0
            },
            latency: {
                values: [],
                buckets: {
                    fast: [], // <100ms
                    medium: [], // 100-500ms
                    slow: [] // >500ms
                }
            },
            errors: []
        };

        this.initPromise = this.initWithRetry();
    }

    log(...args) {
        if (this.debug) {
            console.log('[AI Assistant]', ...args);
        }
    }

    error(...args) {
        if (this.debug) {
            console.error('[AI Assistant Error]', ...args);
            this.metrics.errors.push({
                timestamp: new Date().toISOString(),
                error: args
            });
        }
    }

    async isCircuitClosed() {
        if (!this.circuitBreaker.isOpen) return true;
        
        const now = Date.now();
        if (now - this.circuitBreaker.lastFailure > this.circuitBreaker.resetTimeout) {
            this.log('Circuit breaker reset after timeout');
            this.circuitBreaker.isOpen = false;
            this.circuitBreaker.failureCount = 0;
            return true;
        }
        
        this.log('Circuit breaker is open - preventing request');
        return false;
    }

    async measureLatency(operation) {
        if (!(await this.isCircuitClosed())) {
            throw new Error('Circuit breaker is open - too many recent failures');
        }

        const start = performance.now();
        this.metrics.requests.total++;

        try {
            const result = await operation();
            const duration = performance.now() - start;
            
            // Track latency
            this.metrics.latency.values.push(duration);
            if (duration < 100) {
                this.metrics.latency.buckets.fast.push(duration);
            } else if (duration < 500) {
                this.metrics.latency.buckets.medium.push(duration);
            } else {
                this.metrics.latency.buckets.slow.push(duration);
            }
            
            this.metrics.requests.successful++;
            this.circuitBreaker.failureCount = Math.max(0, this.circuitBreaker.failureCount - 1);
            
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            this.metrics.requests.failed++;
            this.metrics.latency.values.push(duration);
            
            this.circuitBreaker.failureCount++;
            this.circuitBreaker.lastFailure = Date.now();
            
            if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
                this.circuitBreaker.isOpen = true;
                this.log('Circuit breaker opened due to consecutive failures');
            }
            
            throw error;
        }
    }

    async checkConnection() {
        return this.measureLatency(async () => {
            try {
                const response = await fetch(`${this.apiUrl}/health`, {
                    method: 'GET',
                    headers: { 
                        'Accept': 'application/json',
                        'X-Request-ID': crypto.randomUUID()
                    }
                });
                return response.ok;
            } catch (error) {
                this.error('Connection check failed:', error);
                return false;
            }
        });
    }

    async init() {
        if (!ENV.ENABLE_AI) {
            this.log('AI features are disabled');
            return null;
        }

        return this.measureLatency(async () => {
            try {
                this.log('Initializing using API:', this.apiUrl);
                
                const isConnected = await this.checkConnection();
                if (!isConnected) {
                    throw new Error('API endpoint is not reachable');
                }
                
                const response = await fetch(`${this.apiUrl}/config`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-Request-ID': crypto.randomUUID()
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to load configuration: ${response.status}\nResponse: ${errorText}`);
                }

                const config = await response.json();
                this.initialized = true;
                this.log('Initialized successfully with config:', config);
                return config;
            } catch (error) {
                this.error('Initialization failed:', {
                    error: error.message,
                    stack: error.stack,
                    apiUrl: this.apiUrl,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
        });
    }

    async generateAffirmations(intention) {
        if (!ENV.ENABLE_AI || !this.initialized) {
            return {
                success: false,
                message: 'AI features are not available. Please try again later.',
                affirmations: []
            };
        }

        return this.measureLatency(async () => {
            try {
                this.log('Generating affirmations for intention:', intention);
                const response = await fetch(`${this.apiUrl}/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Request-ID': crypto.randomUUID()
                    },
                    body: JSON.stringify({ intention })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Generation failed: ${response.status}\nResponse: ${errorText}`);
                }

                const result = await response.json();
                this.log('Generated affirmations:', result.affirmations);
                return {
                    success: true,
                    affirmations: result.affirmations || []
                };
            } catch (error) {
                this.error('Failed to generate affirmations:', {
                    error: error.message,
                    stack: error.stack,
                    intention: intention,
                    apiUrl: this.apiUrl,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
        });
    }

    getMetrics() {
        const calculatePercentile = (arr, p) => {
            if (arr.length === 0) return null;
            const sorted = [...arr].sort((a, b) => a - b);
            const pos = (sorted.length - 1) * p;
            const base = Math.floor(pos);
            const rest = pos - base;
            if (sorted[base + 1] !== undefined) {
                return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
            }
            return sorted[base];
        };

        return {
            requests: {
                ...this.metrics.requests,
                successRate: (this.metrics.requests.successful / this.metrics.requests.total) * 100
            },
            latency: {
                current: this.metrics.latency.values[this.metrics.latency.values.length - 1],
                average: this.metrics.latency.values.reduce((a, b) => a + b, 0) / this.metrics.latency.values.length,
                p50: calculatePercentile(this.metrics.latency.values, 0.5),
                p95: calculatePercentile(this.metrics.latency.values, 0.95),
                p99: calculatePercentile(this.metrics.latency.values, 0.99),
                buckets: {
                    fast: this.metrics.latency.buckets.fast.length,
                    medium: this.metrics.latency.buckets.medium.length,
                    slow: this.metrics.latency.buckets.slow.length
                }
            },
            circuitBreaker: {
                status: this.circuitBreaker.isOpen ? 'open' : 'closed',
                failureCount: this.circuitBreaker.failureCount,
                lastFailure: this.circuitBreaker.lastFailure,
                timeToReset: this.circuitBreaker.isOpen ? 
                    Math.max(0, this.circuitBreaker.resetTimeout - (Date.now() - this.circuitBreaker.lastFailure)) :
                    0
            },
            errors: this.metrics.errors.slice(-10) // Last 10 errors
        };
    }
}

export default AIAssistant;
