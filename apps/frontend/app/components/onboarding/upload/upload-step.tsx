'use client';

import { UploadAboutMeView } from './upload-about-me-view';

interface UploadStepProps {
  onBack: () => void;
}

export function UploadStep({ onBack }: UploadStepProps) {
  const isUploading = false; // Pure UI for now

  const handleUploadFile = async (file: File) => {
    console.log('File staged:', file.name);
  };

  return (
    <UploadAboutMeView 
      onUpload={handleUploadFile}
      onBack={onBack}
      isUploading={isUploading}
    />
  );
}
