'use client';

import { UserButton } from '@clerk/nextjs';
import { config } from '@/lib/config';
import { Button, toast } from '@heroui/react';

export default function TestPage() {
  return (
    <div className="flex h-svh w-full items-center justify-center">
      <div data-status="success" className="test-2">
        31
      </div>
      <UserButton signInUrl={config.auth.signInUrl} />
      <Button variant="outline" onClick={() => toast.warning('Toast')}>
        Toast
      </Button>
    </div>
  );
}
