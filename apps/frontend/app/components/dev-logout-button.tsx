'use client';

import { useClerk } from '@clerk/nextjs';
import { Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';

import { config } from '@/lib/config';

export function DevLogoutButton() {
  const clerk = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      // Keep this dev-only control on the client so session clearing works
      // immediately without adding a separate route surface.
      await clerk.signOut({ redirectUrl: config.auth.afterSignOutUrl });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <Button
        aria-label="Sign out current session"
        isIconOnly
        onPress={handleSignOut}
        isDisabled={isSigningOut}
        className="shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isSigningOut ? (
          <>
            <Spinner color="current" size="sm" />
            Signing Out...
          </>
        ) : (
          <>
            <Icon icon="lucide:log-out" className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}
