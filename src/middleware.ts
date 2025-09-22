
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const hasAuth = request.cookies.has('auth');
  const { pathname } = request.nextUrl;

  // If user is authenticated and tries to access login, redirect to dashboard
  if (hasAuth && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and tries to access a protected route, redirect to login
  if (!hasAuth && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
 
  return NextResponse.next();
}
 
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
