'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NextLink from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { MethodSelection, ManualEntryForm } from '../components/onboarding';
import type { OnboardingMethod, OnboardingFormData } from './types';
import { LOGOS } from '@/lib/config';
import { Button } from '@heroui/react';

export default function OnboardingPage() {
  const [selectedMethod, setSelectedMethod] = useState<OnboardingMethod>("manual");
  const isMethodSelected = selectedMethod !== null;

  const handleSelectMethod = (method: OnboardingMethod) => {
    // if (method === null) {
    //   // Skip - redirect to dashboard
    //   console.log('Skipping onboarding, redirecting to dashboard...');
    //   return;
    // }

    setSelectedMethod(method);
  };

  const handleBackToMethods = () => {
    setSelectedMethod(null);
  };

  const handleFormComplete = (data: OnboardingFormData) => {
    console.log('Form completed:', data);
    // TODO: Wire up API call
  };

  const renderContent = () => {
    if (!isMethodSelected) {
      return <MethodSelection onSelectMethod={handleSelectMethod} />;
    }

    switch (selectedMethod) {
      case 'github':
        return (
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-surface-secondary mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl">
                <Icon icon="mdi:github" className="size-10" />
              </div>
              <h2 className="text-foreground text-2xl font-bold">
                Connect GitHub
              </h2>
              <p className="text-muted mt-2">
                GitHub integration coming soon...
              </p>
              <Button onClick={handleBackToMethods} className="mt-6">
                <Icon icon="lucide:arrow-left" />
                Back to methods
              </Button>
            </motion.div>
          </div>
        );

      case 'upload':
        return (
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-surface-secondary mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl">
                <Icon icon="lucide:upload" className="size-10" />
              </div>
              <h2 className="text-foreground text-2xl font-bold">
                Upload About Me
              </h2>
              <p className="text-muted mt-2">File upload coming soon...</p>
              <Button onClick={handleBackToMethods} className="mt-6">
                <Icon icon="lucide:arrow-left" />
                Back to methods
              </Button>
            </motion.div>
          </div>
        );

      case 'manual':
        return (
          <ManualEntryForm
            onBack={handleBackToMethods}
            onComplete={handleFormComplete}
          />
        );

      default:
        return <MethodSelection onSelectMethod={handleSelectMethod} />;
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      {/* <motion.header
        className="border-divider border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <NextLink
            href="/"
            className="text-foreground flex items-center gap-2.5 text-xl font-bold transition-opacity hover:opacity-80"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-md">
              <Image
                src={LOGOS.TAILORCV}
                alt="TailorCV Logo"
                width={36}
                height={36}
                priority
                quality={100}
              />
            </div>
            TailorCV
          </NextLink>

          {!isMethodSelected && (
            <motion.button
              type="button"
              className="text-muted hover:text-foreground flex items-center gap-1 text-sm transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => handleSelectMethod(null)}
            >
              Skip for now
              <Icon icon="lucide:arrow-right" className="size-4" />
            </motion.button>
          )}
        </div>
      </motion.header> */}

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={isMethodSelected ? selectedMethod : 'selection'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
