import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getCurrentUserFromDb } from '@/lib/auth/auth-service';

// Define the shape of our authenticated request
export interface AuthenticatedRequest extends NextRequest {
  user?: any;
}

// Helper function to create JSON response
export function jsonRes(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

// Export NextResponse for use in routes
export { NextResponse };