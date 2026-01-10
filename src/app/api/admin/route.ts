import { NextRequest } from 'next/server';
import { withAuth, jsonRes } from '@/lib/auth/middleware';

// GET /api/admin - Admin-only route example
export const GET = withAuth(async (req) => {
  try {
    // User is already attached to the request by withAuth middleware
    const user = req.user;

    // This route is protected and only accessible to admins
    if (user.role !== 'ADMIN') {
      return jsonRes({ error: 'Forbidden: Admin access required' }, 403);
    }

    return jsonRes({
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
    return jsonRes({ error: 'Internal server error' }, 500);
  }
}, 'ADMIN'); // Require ADMIN role