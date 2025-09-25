
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export async function middleware(request: NextRequest) {
  const hasAuth = request.cookies.has('auth');
  const { pathname } = request.nextUrl;

  // Allow access to login page regardless of auth status
  if (pathname === '/login') {
    return NextResponse.next();
  }
  
  // Allow access to the exam taking page
  if (pathname.startsWith('/exam/')) {
      return NextResponse.next();
  }

  // Allow access to the root registration page
  if (pathname === '/') {
      return NextResponse.next();
  }

  // If user is not authenticated and trying to access dashboard, redirect to login
  if (!hasAuth && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
  }
 
  // If user is authenticated and on a dashboard page, allow them
  if (hasAuth && pathname.startsWith('/dashboard')) {
      return NextResponse.next();
  }

 
  return NextResponse.next();
}
 
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/', '/exam/:path*'],
}
