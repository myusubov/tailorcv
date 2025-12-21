import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
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
  '/',
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

  const isOnboardingRoute = pathname.startsWith('/onboarding');

  // 1. If user is logged in and trying to access auth routes (including root '/'), redirect to dashboard
  // CRITICAL: Explicitly skip /sso-callback to prevent loops during OAuth finalization
  if (userId && isAuthRoute(req) && pathname !== '/sso-callback') {
    return NextResponse.redirect(new URL('/test', req.url));
  }

  // 2. If user is not logged in and trying to access protected routes or onboarding, redirect to login
  if (!userId && (isProtectedRoute(req) || isOnboardingRoute)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Resume status check for authenticated users
  if (userId && (isProtectedRoute(req) || isOnboardingRoute)) {
    const response = await fetch(new URL('/api/onboarding/status', req.url), {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });

    const json = (await response.json().catch(() => null)) as {
      ok: boolean;
      data?: { hasBaseResume?: boolean };
    } | null;

    const hasBaseResume = Boolean(json?.ok && json?.data?.hasBaseResume);

    // If they have a base resume but are trying to access onboarding, redirect home/dashboard
    if (hasBaseResume && isOnboardingRoute) {
      return NextResponse.redirect(new URL('/test', req.url));
    }

    // If they DON'T have a base resume and are NOT on the onboarding page, force them to onboarding
    if (!hasBaseResume && !isOnboardingRoute) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
