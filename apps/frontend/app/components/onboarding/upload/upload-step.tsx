'use client';

import { toast } from 'sonner';

import { UploadAboutMeView } from './upload-about-me-view';

interface UploadStepProps {
  onBack: () => void;
}

export function UploadStep({ onBack }: UploadStepProps) {
  const handleUploadFile = async (file: File) => {
    toast.info(
      `Resume upload analysis is not implemented yet. ${file.name} is selected.`,
    );
  };

  return (
    <UploadAboutMeView
      onUpload={handleUploadFile}
      onBack={onBack}
      isUploading={false}
    />
  );
}
