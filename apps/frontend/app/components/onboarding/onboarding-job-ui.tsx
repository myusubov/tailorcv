'use client';

import { GenerationOverlay } from './generation-overlay';
import { SuccessModal } from './success-modal';
import { useOnboardingJob } from './onboarding-job-context';

export function OnboardingJobUI() {
  const { isActive, stage, progressPct, generatedData, showSuccessModal, setShowSuccessModal } =
    useOnboardingJob();

  return (
    <>
      <GenerationOverlay
        isVisible={isActive}
        stage={stage ?? undefined}
        progressPct={progressPct ?? undefined}
      />
      <SuccessModal
        isOpen={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        data={generatedData}
      />
    </>
  );
}

