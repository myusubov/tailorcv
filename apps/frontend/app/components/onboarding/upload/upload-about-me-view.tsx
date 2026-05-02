'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { fileUploadSchema } from '@/lib/schemas/upload';
import { StepHeader } from '../step-header';
import { formatFileSize, getFileIcon } from '@/lib/utils/files';

interface UploadAboutMeViewProps {
  onUpload: (file: File) => Promise<void>;
  onBack: () => void;
  isUploading: boolean;
}

export function UploadAboutMeView({
  onUpload,
  onBack,
  isUploading,
}: UploadAboutMeViewProps) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const error = fileRejections[0].errors[0];
        if (error.code === 'file-invalid-type') {
          toast.error('Only PDF, DOCX, and TXT files are supported.');
        } else if (error.code === 'file-too-large') {
          toast.error('File is too large. Max size is 5MB.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        const result = fileUploadSchema.safeParse({ file: selectedFile });
        if (!result.success) {
          toast.error(result.error.issues[0].message);
          return;
        }
        setFile(selectedFile);
      }
    },
    [],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'text/plain': ['.txt'],
    },
  });

  const handleRemoveFile = () => setFile(null);
  const handleConfirm = async () => {
    if (!file) return;
    await onUpload(file);
  };

  const borderColor = isDragReject
    ? 'border-danger'
    : isDragAccept
      ? 'border-primary'
      : isDragActive
        ? 'border-primary'
        : 'border-default-200';

  return (
    <div className="mx-auto w-full max-w-xl">
      <StepHeader
        icon="lucide:upload"
        title="Upload your Resume"
        description="We'll use AI to build your base profile from your document."
      />

      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
            >
              <div
                {...getRootProps()}
                className={`group bg-default-50/50 hover:bg-default-100 hover:border-default-400 hover:shadow-primary/5 relative flex h-72 w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out hover:shadow-xl ${borderColor} `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-4 p-8 text-center">
                  <div className="bg-primary/10 text-primary rounded-3xl p-5 transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-110 group-hover:rotate-3">
                    <Icon icon="solar:cloud-upload-bold-duotone" width={48} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-default-900 text-xl font-bold">
                      {isDragActive
                        ? 'Drop it here!'
                        : 'Click to upload or drag & drop'}
                    </p>
                    <p className="text-default-500 text-sm">
                      PDF, DOCX or TXT (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <div className="border-primary/20 bg-primary/5 shadow-primary/5 relative flex items-center gap-5 overflow-hidden rounded-3xl border-2 p-6 shadow-xl">
                <div className="shrink-0 text-5xl">
                  <Icon icon={getFileIcon(file.name)} />
                </div>

                <div className="min-w-0 grow">
                  <p className="text-default-900 truncate text-lg font-bold">
                    {file.name}
                  </p>
                  <p className="text-default-500 text-sm font-medium">
                    {formatFileSize(file.size)} • Ready to process
                  </p>
                </div>

                <div className="shrink-0">
                  <Tooltip delay={500}>
                    <Tooltip.Trigger>
                      <Button
                        isIconOnly
                        variant="danger"
                        size="md"
                        onPress={handleRemoveFile}
                        isDisabled={isUploading}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={22} />
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content showArrow>Discard file</Tooltip.Content>
                  </Tooltip>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="mt-10 flex items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Button
            variant="ghost"
            onPress={onBack}
            isDisabled={isUploading}
            className="text-muted-foreground hover:text-foreground"
          >
            <Icon icon="lucide:arrow-left" className="size-4" />
            Back
          </Button>

          {file && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                variant="primary"
                onPress={handleConfirm}
                isPending={isUploading}
              >
                {!isUploading && (
                  <Icon
                    icon="solar:magic-stick-3-bold-duotone"
                    className="size-5"
                  />
                )}
                Generate profile with AI
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
