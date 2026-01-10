import { NextRequest } from 'next/server';
import { signIn } from '@/lib/auth/auth-service';
import { jsonRes } from '@/lib/auth/middleware';

// POST /api/auth/login - User login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Basic validation
    if (!email || !password) {
      return jsonRes({ error: 'Email and password are required' }, 400);
    }

    // Attempt to sign in
    const result = await signIn(email, password);

    if (result.error) {
      return jsonRes({ error: result.error }, 400);
    }

    // Return success response with user data
    return jsonRes({
      message: 'Login successful',
      user: {
        id: result.data?.user?.id,
        email: result.data?.user?.email,
      },
      // Note: We don't send tokens here as they're managed by Supabase client-side
    }, 200);
  } catch (error) {
    console.error('Login API error:', error);
    return jsonRes({ error: 'Internal server error' }, 500);
  }
}