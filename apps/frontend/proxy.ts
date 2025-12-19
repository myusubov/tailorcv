import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
// Note: These routes are accessible without login
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/forgot-password(.*)',
  '/sso-callback(.*)',
  '/api/webhooks(.*)',
  '/terms(.*)',
  '/privacy(.*)',
]);

// Auth routes (login, register, etc.) - redirect to dashboard if already logged in
const isAuthRoute = createRouteMatcher([
  '/login(.*)',
  '/register(.*)',
  '/forgot-password(.*)',
]);

// Protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/test(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // If user is logged in and trying to access auth routes, redirect to dashboard
  if (userId && isAuthRoute(req)) {
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If user is not logged in and trying to access protected routes, redirect to login
  if (!userId && isProtectedRoute(req)) {
    const loginUrl = new URL('/login', req.url);
    // Optionally add the original URL as a redirect parameter
    loginUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in but doesn't have a base resume, force onboarding.
  // Use the BFF route handler so auth stays server-side.
  // if (userId && isProtectedRoute(req) && !pathname.startsWith('/onboarding')) {
  //   const response = await fetch(new URL('/api/onboarding/status', req.url), {
  //     headers: { cookie: req.headers.get('cookie') ?? '' },
  //     cache: 'no-store',
  //   });

  //   const json = (await response.json().catch(() => null)) as {
  //     ok: boolean;
  //     data?: { hasBaseResume?: boolean };
  //   } | null;

  //   const hasBaseResume = Boolean(json?.ok && json?.data?.hasBaseResume);

  //   if (!hasBaseResume) {
  //     return NextResponse.redirect(new URL('/onboarding', req.url));
  //   }
  // }

  // For public routes or authenticated users accessing allowed routes, continue
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
