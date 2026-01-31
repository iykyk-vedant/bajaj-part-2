import { NextRequest, NextResponse } from 'next/server';

// Middleware to enforce DC Number and Partcode-based data isolation
export function dataIsolationMiddleware(request: NextRequest) {
  // Skip middleware for API routes that don't need isolation
  const publicPaths = [
    '/api/auth',
    '/api/dc-numbers',
    '/api/admin',
    '/_next',
    '/favicon.ico',
    '/login',
    '/signup'
  ];

  const pathname = request.nextUrl.pathname;
  
  // Check if this path should be skipped
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For authenticated routes, check session data
  const dcNumber = request.cookies.get('selectedDcNumber')?.value || 
                   (typeof window !== 'undefined' ? localStorage.getItem('selectedDcNumber') : null);
  const partCode = request.cookies.get('selectedPartCode')?.value || 
                   (typeof window !== 'undefined' ? localStorage.getItem('selectedPartCode') : null);

  // If no session data and not on login page, redirect to login
  if ((!dcNumber || !partCode) && pathname !== '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Add session data to request headers for backend use
  const requestHeaders = new Headers(request.headers);
  if (dcNumber) {
    requestHeaders.set('x-session-dc-number', dcNumber);
  }
  if (partCode) {
    requestHeaders.set('x-session-part-code', partCode);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Helper function to get session data from request
export function getSessionDataFromRequest(request: NextRequest) {
  const dcNumber = request.headers.get('x-session-dc-number') || 
                   request.cookies.get('selectedDcNumber')?.value;
  const partCode = request.headers.get('x-session-part-code') || 
                   request.cookies.get('selectedPartCode')?.value;
  
  return { dcNumber, partCode };
}