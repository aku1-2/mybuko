import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  // If no token and trying to access protected routes
  if (!token) {
    if (request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/goal') ||
        request.nextUrl.pathname.startsWith('/profile') ||
        request.nextUrl.pathname.startsWith('/settings')) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // If logged in and trying to access auth pages (except Google OAuth callback)
  if (token) {
    if (request.nextUrl.pathname.startsWith('/auth') && 
        !request.nextUrl.pathname.startsWith('/auth/google-callback')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/goal/:path*', '/profile/:path*', '/settings/:path*', '/auth/:path*']
}