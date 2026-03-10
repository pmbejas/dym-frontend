import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;
  const isLogout = request.nextUrl.searchParams.get('logout') === 'true';

  // Debug logging
  console.log(`[Middleware] ${request.method} ${path} | Token: ${token ? 'YES' : 'NO'} | Logout: ${isLogout}`);

  // 1. ASSET EXCLUSION:
  // Explicitly ignore _next, api, and common file extensions.
  if (
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.startsWith('/static') || 
    path.includes('.') // catch-all for files (e.g. .js, .css, .png, .ico)
  ) {
    return NextResponse.next();
  }

  // 2. LOGOUT HANDLING:
  if (isLogout) {
      console.log('[Middleware] Processing logout. Clearing cookie.');
      const response = NextResponse.next(); 
      response.cookies.delete('token');
      return response;
  }

  // 3. AUTH LOGIC:
  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.includes(path);

  // Authenticated User Logic
  if (token) {
    // If on login page -> Redirect to Panel
    if (isPublicPath) {
      console.log('[Middleware] Auth user on login -> Redirecting to /panel');
      return NextResponse.redirect(new URL('/panel', request.url));
    }
    // If on root -> Redirect to Panel
    if (path === '/') {
        console.log('[Middleware] Auth user on root -> Redirecting to /panel');
        return NextResponse.redirect(new URL('/panel', request.url));
    }
    // Allow access to protected routes
    return NextResponse.next();
  }

  // Unauthenticated User Logic
  if (!token) {
    // If on protected route (not public) -> Redirect to Login
    if (!isPublicPath) {
      console.log(`[Middleware] No token on ${path} -> Redirecting to /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Allow access to public routes
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
