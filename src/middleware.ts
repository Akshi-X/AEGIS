
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

  // If user is authenticated...
  if (hasAuth) {
    // and tries to access the root registration page, redirect to dashboard
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // otherwise, allow access to dashboard pages
    return NextResponse.next();
  }

  // If user is not authenticated...
  if (!hasAuth) {
    // and tries to access a protected dashboard route, redirect to login
    if (pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    // and is on the root page, allow them to stay for PC registration
    if (pathname === '/') {
        return NextResponse.next();
    }
  }
 
  return NextResponse.next();
}
 
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/', '/exam/:path*'],
}

    