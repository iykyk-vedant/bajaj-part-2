import { NextResponse } from 'next/server';
import { getAllDcNumbers } from '@/lib/pg-db';

export async function GET() {
  try {
    const dcNumbers = await getAllDcNumbers();
    return NextResponse.json({ dcNumbers });
  } catch (error) {
    console.error('Error fetching DC numbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DC numbers' },
      { status: 500 }
    );
  }
}