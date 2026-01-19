import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getCurrentUserFromDb } from '@/lib/auth/auth-service';
import { handleCorsPreflight, isOriginAllowed, addCorsHeaders } from '@/lib/api/cors';

// GET /api/auth/me - Get current authenticated user
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsPreflightResponse = handleCorsPreflight(request);
  if (corsPreflightResponse) {
    return corsPreflightResponse;
  }

  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response = NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      );
      
      // Add CORS headers
      const origin = request.headers.get('origin');
      if (isOriginAllowed(origin || undefined)) {
        addCorsHeaders(response, origin || undefined);
      }
      
      return response;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token
    const isValid = await verifyToken(token);
    if (!isValid) {
      const response = NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      );
      
      // Add CORS headers
      const origin = request.headers.get('origin');
      if (isOriginAllowed(origin || undefined)) {
        addCorsHeaders(response, origin || undefined);
      }
      
      return response;
    }

    // Get user from Neon DB
    const user = await getCurrentUserFromDb(token);
    if (!user) {
      const response = NextResponse.json(
        { error: 'Unauthorized: User not found in database' },
        { status: 401 }
      );
      
      // Add CORS headers
      const origin = request.headers.get('origin');
      if (isOriginAllowed(origin || undefined)) {
        addCorsHeaders(response, origin || undefined);
      }
      
      return response;
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        supabase_user_id: user.supabase_user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at
      }
    });
    
    // Add CORS headers
    const origin = request.headers.get('origin');
    if (isOriginAllowed(origin || undefined)) {
      addCorsHeaders(response, origin || undefined);
    }
    
    return response;
  } catch (error) {
    console.error('Get user error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    
    // Add CORS headers
    const origin = request.headers.get('origin');
    if (isOriginAllowed(origin || undefined)) {
      addCorsHeaders(response, origin || undefined);
    }
    
    return response;
  }
}