import { UserButton } from '@clerk/nextjs';
import { config } from '@/lib/config';
import { getOnboardingStatus } from '@/lib/data/onboarding';

export default async function TestPage() {
  const status = await getOnboardingStatus({
    params: {
      userId: '123',
    },
  });

  console.log(status);

  return (
    <div className="flex h-svh w-full items-center justify-center">
      <UserButton signInUrl={config.auth.signInUrl} />
    </div>
  );
}
