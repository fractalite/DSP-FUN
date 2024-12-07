/**
 * Utility class for handling retries with exponential backoff
 */
export class RetryHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // Base delay in milliseconds
    this.maxDelay = options.maxDelay || 10000; // Maximum delay in milliseconds
    this.retryableErrors = options.retryableErrors || [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'RATE_LIMIT_EXCEEDED',
      'TIMEOUT',
      '429', // Too Many Requests
      '503', // Service Unavailable
      '504', // Gateway Timeout
    ];
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error) {
    // Check error code
    if (error.code && this.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check HTTP status
    if (error.status && this.retryableErrors.includes(error.status.toString())) {
      return true;
    }

    // Check error message for network-related issues
    const errorMessage = error.message?.toLowerCase() || '';
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('connection')
    );
  }

  /**
   * Calculate delay for next retry using exponential backoff
   */
  getDelay(retryCount) {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      this.maxDelay,
      this.baseDelay * Math.pow(2, retryCount)
    );
    // Add random jitter (±20%)
    const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
    return exponentialDelay + jitter;
  }

  /**
   * Execute function with retry logic
   */
  async execute(fn, context = null) {
    let lastError;
    
    for (let retryCount = 0; retryCount <= this.maxRetries; retryCount++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (
          retryCount === this.maxRetries || // Max retries reached
          !this.isRetryableError(error)     // Non-retryable error
        ) {
          break;
        }

        // Calculate delay for next retry
        const delay = this.getDelay(retryCount);
        
        // Log retry attempt if context is provided
        if (context) {
          console.warn(
            `Retry attempt ${retryCount + 1}/${this.maxRetries} for ${context}. ` +
            `Waiting ${Math.round(delay)}ms. Error: ${error.message}`
          );
        }

        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we get here, all retries failed
    throw lastError;
  }
}
