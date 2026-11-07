'use client';

import { ErrorState } from '@/app/components/ui/error-state';

export default function Error({ retry }: { retry: () => void }) {
  return (
    <ErrorState
      title="Something went wrong"
      description="We couldn't load this page. Please try again."
      onRetry={retry}
    />
  );
}
