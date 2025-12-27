'use client';

import { UploadAboutMeView } from './upload-about-me-view';
import { useActionMutation } from '@/lib/hooks/use-action-mutation';
import { startOnboardingAboutMeJobAction } from '@/lib/actions/onboarding.actions';
import { useOnboardingJob } from '../onboarding-job-context';

interface UploadStepProps {
  onBack: () => void;
}

export function UploadStep({ onBack }: UploadStepProps) {
  const { beginJob } = useOnboardingJob()
  const { mutateAsync, isPending } = useActionMutation(startOnboardingAboutMeJobAction, {
    successMessage: 'Resume uploaded successfully!',
    onSuccess: ({ jobId }) => {
      beginJob(jobId)
    },
  });

  const handleUploadFile = async (file: File) => {
    if (isPending) return;
    const formData = new FormData();
    formData.append('file', file);
    await mutateAsync(formData);
  };

  return (
    <UploadAboutMeView
      onUpload={handleUploadFile}
      onBack={onBack}
      isUploading={isPending}
    />
  );
}
