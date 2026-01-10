import { NextRequest } from 'next/server';
import { withAuth, jsonRes, AuthenticatedRequest } from '@/lib/auth/middleware';

// GET /api/auth/me - Get current authenticated user
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // User is already attached to the request by withAuth middleware
    const user = req.user;

    return jsonRes({
      user: {
        id: user.id,
        supabase_user_id: user.supabase_user_id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return jsonRes({ error: 'Internal server error' }, 500);
  }
});