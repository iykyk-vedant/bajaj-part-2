import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getCurrentUserFromDb } from '@/lib/auth/auth-service';

// GET /api/user - User-protected route example
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token
    const isValid = await verifyToken(token);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user from Neon DB
    const user = await getCurrentUserFromDb(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: User not found in database' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'User data accessed successfully',
      userData: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      }
    });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}