import { NextRequest } from 'next/server';
import { withAuth, jsonRes } from '@/lib/auth/middleware';

// GET /api/user - User-protected route example
export const GET = withAuth(async (req) => {
  try {
    // User is already attached to the request by withAuth middleware
    const user = req.user;

    return jsonRes({
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
    return jsonRes({ error: 'Internal server error' }, 500);
  }
}); // No specific role required, just authenticated user