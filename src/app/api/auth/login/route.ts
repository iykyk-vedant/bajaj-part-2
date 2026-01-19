import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth/auth-service';
import { handleCorsPreflight, isOriginAllowed, addCorsHeaders } from '@/lib/api/cors';

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsPreflightResponse = handleCorsPreflight(request);
  if (corsPreflightResponse) {
    return corsPreflightResponse;
  }

  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      const response = NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      
      // Add CORS headers
      const origin = request.headers.get('origin');
      if (isOriginAllowed(origin || undefined)) {
        addCorsHeaders(response, origin || undefined);
      }
      
      return response;
    }

    // Attempt to sign in
    const result = await signIn(email, password);

    if (result.error) {
      const response = NextResponse.json({ error: result.error }, { status: 400 });
      
      // Add CORS headers
      const origin = request.headers.get('origin');
      if (isOriginAllowed(origin || undefined)) {
        addCorsHeaders(response, origin || undefined);
      }
      
      return response;
    }

    // Get the session to extract tokens
    const session = result.data?.session;
    
    // Return success response with user data and tokens
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: result.data?.user?.id,
        email: result.data?.user?.email,
        name: result.data?.user?.user_metadata?.name,
      },
      token: session?.access_token,
      refreshToken: session?.refresh_token,
    }, { status: 200 });
    
    // Add CORS headers
    const origin = request.headers.get('origin');
    if (isOriginAllowed(origin || undefined)) {
      addCorsHeaders(response, origin || undefined);
    }
    
    return response;
  } catch (error) {
    console.error('Login API error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    
    // Add CORS headers
    const origin = request.headers.get('origin');
    if (isOriginAllowed(origin || undefined)) {
      addCorsHeaders(response, origin || undefined);
    }
    
    return response;
  }
}