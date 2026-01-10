import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getCurrentUserFromDb } from '@/lib/auth/auth-service';

// GET /api/admin - Admin-only route example
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

    // Check if user has admin role
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: 'Admin data accessed successfully',
      adminData: {
        // Sample admin data
        totalUsers: 100,
        systemStats: {
          uptime: '24 hours',
          activeSessions: 10,
        },
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      }
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}