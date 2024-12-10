// /netlify/functions/generate.js

const handler = async (event) => {
    // Set up CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*', // Configure this to your domain in production
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
  
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers
      };
    }
  
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
          error: 'Method not allowed'
        })
      };
    }
  
    try {
      // Parse the request body
      const body = JSON.parse(event.body);
      const { prompt } = body;
  
      if (!prompt) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Prompt is required'
          })
        };
      }
  
      // Your API logic here
      const result = {
        message: "Generated response",
        prompt: prompt,
        // Add your generation logic here
      };
  
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
  
    } catch (error) {
      console.error('Function error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Internal server error',
          details: error.message
        })
      };
    }
  };
  
  exports.handler = handler;