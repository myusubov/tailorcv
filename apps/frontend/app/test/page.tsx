'use client';
import { UserButton } from '@clerk/nextjs';

export default function TestPage() {
    return (
        <div className='w-full h-svh flex items-center justify-center'>
            <UserButton />
        </div>
    );
}