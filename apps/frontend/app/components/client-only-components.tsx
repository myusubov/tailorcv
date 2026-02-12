'use client';

import dynamic from 'next/dynamic';

const AIChatBox = dynamic(
  () => import('./resumes/review/ai-chat-box').then((mod) => mod.AIChatBox),
  { ssr: false },
);

const ThemeToggle = dynamic(
  () => import('./theme-toggle').then((mod) => mod.ThemeToggle),
  { ssr: false },
);

export function ClientOnlyComponents() {
  return (
    <>
      <AIChatBox />
      <ThemeToggle />
    </>
  );
}
