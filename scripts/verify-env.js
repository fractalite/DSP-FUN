#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required environment variables
const REQUIRED_VARS = {
    GROQ_API_KEY: {
        description: 'API key for Groq AI service',
        example: 'gsk_xxxxx',
        production: true
    },
    GROQ_MODEL_ID: {
        description: 'Model ID for Groq AI service',
        example: 'llama-3.3-70b-versatile',
        production: true
    },
    ENABLE_AI: {
        description: 'Feature flag for AI functionality',
        example: 'true',
        production: true
    }
};

// Optional environment variables with defaults
const OPTIONAL_VARS = {
    GROQ_API_URL: {
        description: 'Groq API endpoint',
        default: 'https://api.groq.com/openai/v1/chat/completions',
        production: false
    }
};

function loadEnvFile(filePath) {
    try {
        const envContent = fs.readFileSync(filePath, 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=');
                if (key && value) {
                    envVars[key.trim()] = value.trim();
                }
            }
        });
        
        return envVars;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

function verifyEnvironment(envVars, isProduction = false) {
    let hasErrors = false;
    let warnings = [];
    
    console.log(chalk.blue('\nVerifying environment variables...\n'));

    // Check required variables
    Object.entries(REQUIRED_VARS).forEach(([varName, config]) => {
        if (!envVars[varName]) {
            if (isProduction && config.production) {
                console.log(chalk.red(`❌ Missing required variable: ${varName}`));
                console.log(chalk.gray(`   Description: ${config.description}`));
                console.log(chalk.gray(`   Example: ${config.example}\n`));
                hasErrors = true;
            } else if (!isProduction) {
                warnings.push({
                    varName,
                    message: `Missing recommended variable: ${varName}`,
                    description: config.description,
                    example: config.example
                });
            }
        } else {
            console.log(chalk.green(`✓ ${varName} is set`));
        }
    });

    // Check optional variables
    Object.entries(OPTIONAL_VARS).forEach(([varName, config]) => {
        if (!envVars[varName]) {
            console.log(chalk.yellow(`ℹ Optional variable ${varName} not set, using default: ${config.default}`));
        } else {
            console.log(chalk.green(`✓ ${varName} is set (optional)`));
        }
    });

    // Display warnings
    if (warnings.length > 0) {
        console.log(chalk.yellow('\nWarnings:'));
        warnings.forEach(warning => {
            console.log(chalk.yellow(`⚠ ${warning.message}`));
            console.log(chalk.gray(`   Description: ${warning.description}`));
            console.log(chalk.gray(`   Example: ${warning.example}\n`));
        });
    }

    // Summary
    console.log('\nEnvironment Verification Summary:');
    if (hasErrors) {
        console.log(chalk.red('❌ Verification failed! Please fix the errors above.'));
        process.exit(1);
    } else if (warnings.length > 0) {
        console.log(chalk.yellow('⚠ Verification passed with warnings.'));
    } else {
        console.log(chalk.green('✓ All environment variables are properly configured!'));
    }
}

// Main execution
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const envPath = path.resolve(process.cwd(), '.env');
const envVars = {
    ...loadEnvFile(envPath),
    ...process.env
};

console.log(chalk.blue(`Checking environment variables for ${isProduction ? 'production' : 'development'} environment`));
verifyEnvironment(envVars, isProduction);
