class EnvironmentError extends Error {
    constructor(message, missingVars = []) {
        super(message);
        this.name = 'EnvironmentError';
        this.missingVars = missingVars;
    }
}

export class EnvHandler {
    constructor() {
        this.requiredVars = {
            GROQ_API_KEY: 'API key for Groq AI service',
            GROQ_MODEL_ID: 'Model ID for Groq AI service',
            ENABLE_AI: 'Feature flag for AI functionality'
        };

        this.optionalVars = {
            GROQ_API_URL: {
                description: 'Groq API endpoint',
                default: 'https://api.groq.com/openai/v1/chat/completions'
            }
        };
    }

    /**
     * Get an environment variable with validation
     * @param {string} name - Name of the environment variable
     * @param {Object} options - Options for getting the variable
     * @param {boolean} options.required - Whether the variable is required
     * @param {*} options.default - Default value if not required
     * @param {Function} options.validate - Validation function
     * @returns {string} The environment variable value
     * @throws {EnvironmentError} If required variable is missing or validation fails
     */
    get(name, options = {}) {
        const {
            required = this.requiredVars.hasOwnProperty(name),
            default: defaultValue = this.optionalVars[name]?.default,
            validate
        } = options;

        const value = process.env[name] || defaultValue;

        if (required && !value) {
            const description = this.requiredVars[name] || 'Required environment variable';
            throw new EnvironmentError(
                `Missing required environment variable: ${name}\nDescription: ${description}`,
                [name]
            );
        }

        if (value && validate) {
            try {
                validate(value);
            } catch (error) {
                throw new EnvironmentError(
                    `Invalid environment variable ${name}: ${error.message}`,
                    [name]
                );
            }
        }

        return value;
    }

    /**
     * Verify all required environment variables are present
     * @param {boolean} throwOnError - Whether to throw an error if verification fails
     * @returns {Object} Verification result
     * @throws {EnvironmentError} If throwOnError is true and verification fails
     */
    verifyAll(throwOnError = true) {
        const missingVars = [];
        const errors = [];

        // Check required variables
        Object.entries(this.requiredVars).forEach(([name, description]) => {
            try {
                this.get(name, { required: true });
            } catch (error) {
                missingVars.push(name);
                errors.push(`${name}: ${description}`);
            }
        });

        if (missingVars.length > 0 && throwOnError) {
            throw new EnvironmentError(
                'Missing required environment variables:\n' + errors.join('\n'),
                missingVars
            );
        }

        return {
            success: missingVars.length === 0,
            missingVars,
            errors
        };
    }

    /**
     * Load all environment variables with their default values
     * @returns {Object} Object containing all environment variables
     */
    loadAll() {
        const env = {};

        // Load required variables
        Object.keys(this.requiredVars).forEach(name => {
            try {
                env[name] = this.get(name);
            } catch (error) {
                env[name] = null;
            }
        });

        // Load optional variables with defaults
        Object.entries(this.optionalVars).forEach(([name, config]) => {
            env[name] = this.get(name, { default: config.default });
        });

        return env;
    }
}

// Create and export singleton instance
export const envHandler = new EnvHandler();
export default envHandler;
