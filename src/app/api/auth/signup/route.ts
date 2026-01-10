import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/lib/auth/auth-service';

// POST /api/auth/signup - User registration
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Attempt to create user
    const result = await signUp(email, password);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Return success response
    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: result.data?.user?.id,
        email: result.data?.user?.email,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}