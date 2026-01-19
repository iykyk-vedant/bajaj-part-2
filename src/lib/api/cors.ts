// CORS configuration
const allowedOrigins = [
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://localhost:3000',
  'https://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://bajaj-part-2-3.onrender.com',
  'https://bajaj.app.local', // Adding the requested domain
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

/**
 * Checks if the origin is allowed
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Adds CORS headers to the response
 */
export function addCorsHeaders(response: Response, origin: string | undefined) {
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', origin || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

/**
 * Handles preflight OPTIONS requests
 */
export function handleCorsPreflight(request: Request) {
  const origin = request.headers.get('origin');
  
  if (request.method === 'OPTIONS') {
    const response = new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
    
    return response;
  }
  
  return null;
}