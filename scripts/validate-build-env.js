#!/usr/bin/env node

import { envHandler } from '../server/src/utils/envHandler.js';

console.log('🔍 Validating production environment variables...\n');

try {
    const { success, missingVars, errors } = envHandler.verifyAll(false);
    
    if (!success) {
        console.error('❌ Production build failed!');
        console.error('The following environment variables are required for production:');
        errors.forEach(error => console.error(`  - ${error}`));
        console.error('\nPlease set these variables in your deployment environment (e.g., Netlify)');
        process.exit(1);
    }
    
    console.log('✅ All required environment variables are properly configured');
    console.log('🚀 Proceeding with production build...\n');
} catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
}
