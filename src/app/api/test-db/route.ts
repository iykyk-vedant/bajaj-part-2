import { NextResponse } from 'next/server';
import { testDatabaseUpdate } from '@/lib/pg-db';

export async function POST() {
  try {
    const result = await testDatabaseUpdate();
    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}