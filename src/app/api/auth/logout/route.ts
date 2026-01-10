import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/auth/auth-service';

// POST /api/auth/logout - User logout
export async function POST(req: NextRequest) {
  try {
    // Attempt to sign out
    const result = await signOut();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Return success response
    return NextResponse.json({
      message: 'Logout successful'
    }, { status: 200 });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}