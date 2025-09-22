
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export async function middleware(request: NextRequest) {
  const hasAuth = await request.cookies.has('auth');
  const { pathname } = request.nextUrl;

  // Allow access to login page
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // If user is authenticated and tries to access root, redirect to dashboard
  if (hasAuth && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and tries to access a protected route, redirect to login
  if (!hasAuth && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is not authenticated and on the root page, allow them to stay for PC registration
  if (!hasAuth && pathname === '/') {
    return NextResponse.next();
  }
 
  return NextResponse.next();
}
 
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/'],
}
