/**
 * Client-side retry handler with exponential backoff
 */
export class ClientRetryHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 5000;
    this.retryableStatuses = options.retryableStatuses || [
      408, // Request Timeout
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504  // Gateway Timeout
    ];
  }

  /**
   * Check if the error is retryable
   */
  isRetryableError(error) {
    // Network errors are always retryable
    if (error instanceof TypeError && error.message.includes('network')) {
      return true;
    }

    // Check if the error has a response with a status
    if (error.response && this.retryableStatuses.includes(error.response.status)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  getDelay(retryCount) {
    const exponentialDelay = Math.min(
      this.maxDelay,
      this.baseDelay * Math.pow(2, retryCount)
    );
    // Add random jitter (±20%)
    const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
    return exponentialDelay + jitter;
  }

  /**
   * Execute with retry logic
   */
  async execute(fn, context = '') {
    let lastError;

    for (let retryCount = 0; retryCount <= this.maxRetries; retryCount++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (
          retryCount === this.maxRetries ||
          !this.isRetryableError(error)
        ) {
          break;
        }

        const delay = this.getDelay(retryCount);
        console.warn(
          `Retry attempt ${retryCount + 1}/${this.maxRetries} for ${context}. ` +
          `Waiting ${Math.round(delay)}ms. Error: ${error.message}`
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
