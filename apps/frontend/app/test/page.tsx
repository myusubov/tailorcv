'use client';
import { UserButton } from '@clerk/nextjs';
import { config } from '@/lib/config';

export default function TestPage() {
  return (
    <div className="flex h-svh w-full items-center justify-center">
      <UserButton signInUrl={config.auth.signInUrl} />
    </div>
  );
}
