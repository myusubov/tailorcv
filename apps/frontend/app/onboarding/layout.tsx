import { Suspense } from 'react';

import { GlobalLoading } from '@/app/components/ui/global-loading';
import { requireNotOnboardedUser } from '@/lib/auth/guards';

async function OnboardingGate({ children }: { children: React.ReactNode }) {
  await requireNotOnboardedUser();

  return children;
}

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<GlobalLoading title="Checking your account…" />}>
      <OnboardingGate>{children}</OnboardingGate>
    </Suspense>
  );
};
