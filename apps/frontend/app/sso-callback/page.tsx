'use client';

import { Spinner } from '@heroui/react';
import Link from 'next/link';

import { AnimatedError } from '@/app/components/ui';
import { useSSOCallback } from '@/app/components/auth/sso-callback/use-sso-callback';

export default function SSOCallbackPage() {
  const { error } = useSSOCallback();

  if (error) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-6">
        <div className="flex max-w-md flex-col gap-4 text-center">
          <div className="space-y-2">
            <h1 className="text-foreground text-lg font-semibold">We couldn&apos;t finish sign in</h1>
            <p className="text-muted-foreground text-sm">
              The OAuth callback returned an error before your session could be finalized.
            </p>
          </div>

          <AnimatedError message={error} />

          <Link
            href="/login"
            aria-label="Back to login"
            className="bg-primary text-primary-foreground inline-flex w-full items-center justify-center rounded-medium px-4 py-2 font-semibold"
          >
            Back to login
          </Link>
          <div id="clerk-captcha" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="text-lg font-semibold">Finishing sign in…</h1>
        <p className="text-muted-foreground text-sm">
          You&apos;ll be redirected automatically once the sign-in is complete.
        </p>
        <Spinner color="current" size="lg" />
        <div id="clerk-captcha" />
      </div>
    </div>
  );
}
