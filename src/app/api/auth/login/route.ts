import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth/auth-service';

// POST /api/auth/login - User login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Attempt to sign in
    const result = await signIn(email, password);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Get the session to extract tokens
    const session = result.data?.session;
    
    // Return success response with user data and tokens
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: result.data?.user?.id,
        email: result.data?.user?.email,
        name: result.data?.user?.user_metadata?.name,
      },
      token: session?.access_token,
      refreshToken: session?.refresh_token,
    }, { status: 200 });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}