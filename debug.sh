#!/bin/bash
export DEBUG=express:*
export NODE_ENV=development
export PORT=9999

# Start the development server with debug logging
echo "Starting development server with debug logging..."
npm run dev
