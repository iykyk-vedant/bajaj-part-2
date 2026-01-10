import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getCurrentUserFromDb } from '@/lib/auth/auth-service';

// Define the shape of our authenticated request
export interface AuthenticatedRequest extends NextRequest {
  user?: any;
}

// Authentication middleware for API routes
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  requiredRole?: string
) {
  return async (req: NextRequest) => {
    // Extract token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token
    const isValid = await verifyToken(token);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user from Neon DB
    const user = await getCurrentUserFromDb(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: User not found in database' },
        { status: 401 }
      );
    }

    // Check role if required
    if (requiredRole && user.role !== requiredRole) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Add user to request and call the handler
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = user;

    return handler(authenticatedReq);
  };
}

// Helper function to create JSON response
export function jsonRes(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

// Export NextResponse for use in routes
export { NextResponse };