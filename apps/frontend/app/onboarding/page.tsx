'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  MethodSelection,
  ManualEntryForm,
  GitHubStep,
  UploadStep,
} from '../components/onboarding';
import type { OnboardingMethod } from './types';
import { OnboardingJobProvider } from '../components/onboarding/onboarding-job-context';
import { OnboardingJobUI } from '../components/onboarding/onboarding-job-ui';

import { useQueryState, parseAsStringLiteral } from 'nuqs';

const methodParser = parseAsStringLiteral([
  'github',
  'upload',
  'manual',
] as const);

function OnboardingContent() {
  const [selectedMethod, setSelectedMethod] = useQueryState(
    'method',
    methodParser,
  );
  const isMethodSelected = selectedMethod !== null;

  const handleSelectMethod = (method: OnboardingMethod) => {
    setSelectedMethod(method as unknown as OnboardingMethod);
  };

  const handleBackToMethods = () => {
    setSelectedMethod(null);
  };

  const renderContent = () => {
    if (!isMethodSelected) {
      return <MethodSelection onSelectMethod={handleSelectMethod} />;
    }

    switch (selectedMethod) {
      case 'github':
        return <GitHubStep onBack={handleBackToMethods} />;

      case 'upload':
        return <UploadStep onBack={handleBackToMethods} />;

      case 'manual':
        return <ManualEntryForm onBack={handleBackToMethods} />;

      default:
        return <MethodSelection onSelectMethod={handleSelectMethod} />;
    }
  };

  return (
    <div className="bg-background min-h-screen">
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
      <OnboardingJobUI />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <OnboardingJobProvider>
      <OnboardingContent />
    </OnboardingJobProvider>
  );
}
