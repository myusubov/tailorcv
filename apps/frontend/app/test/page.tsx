'use client';
import { UserButton } from '@clerk/nextjs';
import { config } from '@/lib/config';

export default function TestPage() {
    return (
        <div className='w-full h-svh flex items-center justify-center'>
          <UserButton signInUrl={config.auth.signInUrl} />
        </div>
    );
}