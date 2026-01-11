import { UserButton } from '@clerk/nextjs';
import { config } from '@/lib/config';

export default async function TestPage() {
  return (
    <div className="flex h-svh w-full items-center justify-center">
      <div data-status="success" className='test-2'>31</div>
      <UserButton signInUrl={config.auth.signInUrl} />
    </div>
  );
}
