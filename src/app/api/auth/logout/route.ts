import { NextRequest } from 'next/server';
import { signOut } from '@/lib/auth/auth-service';
import { jsonRes } from '@/lib/auth/middleware';

// POST /api/auth/logout - User logout
export async function POST(req: NextRequest) {
  try {
    // Attempt to sign out
    const result = await signOut();

    if (result.error) {
      return jsonRes({ error: result.error }, 400);
    }

    // Return success response
    return jsonRes({
      message: 'Logout successful'
    }, 200);
  } catch (error) {
    console.error('Logout API error:', error);
    return jsonRes({ error: 'Internal server error' }, 500);
  }
}