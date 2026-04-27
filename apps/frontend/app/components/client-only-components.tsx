'use client';

import { useAuth } from '@clerk/nextjs';
import dynamic from 'next/dynamic';

import { config } from '@/lib/config';

const AIChatBox = dynamic(
  () => import('./resumes/review/ai-chat-box').then((mod) => mod.AIChatBox),
  { ssr: false },
);

const DevLogoutButton = dynamic(
  () => import('./dev-logout-button').then((mod) => mod.DevLogoutButton),
  { ssr: false },
);

const ThemeToggle = dynamic(
  () => import('./theme-toggle').then((mod) => mod.ThemeToggle),
  { ssr: false },
);

export function ClientOnlyComponents() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <>
      {/* {isLoaded && isSignedIn && <AIChatBox />} */}
      {config.isDev && isLoaded && isSignedIn ? <DevLogoutButton /> : null}
      <ThemeToggle />
    </>
  );
}
