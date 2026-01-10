import { NextRequest } from 'next/server';
import { signUp } from '@/lib/auth/auth-service';
import { jsonRes } from '@/lib/auth/middleware';

// POST /api/auth/signup - User registration
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Basic validation
    if (!email || !password) {
      return jsonRes({ error: 'Email and password are required' }, 400);
    }

    if (password.length < 6) {
      return jsonRes({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Attempt to create user
    const result = await signUp(email, password);

    if (result.error) {
      return jsonRes({ error: result.error }, 400);
    }

    // Return success response
    return jsonRes({
      message: 'Account created successfully',
      user: {
        id: result.data?.user?.id,
        email: result.data?.user?.email,
      }
    }, 201);
  } catch (error) {
    console.error('Signup API error:', error);
    return jsonRes({ error: 'Internal server error' }, 500);
  }
}