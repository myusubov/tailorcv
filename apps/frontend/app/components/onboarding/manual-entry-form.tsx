'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Form } from '@heroui/react';
import { ProgressBar } from './progress-bar';
import {
  ContactStep,
  SummaryStep,
  ExperienceStep,
  ProjectsStep,
  EducationStep,
} from './steps';
import type { ManualEntryStep } from '../../onboarding/types';
import { MANUAL_STEPS } from '../../onboarding/types';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  onboardingSchema,
  type OnboardingFormInput,
} from '@/lib/schemas/onboarding';
import { useActionMutation } from '@/lib/hooks/use-action-mutation';
import { startOnboardingJobAction } from '@/lib/actions/onboarding.actions';
import { fillValues } from '@/lib/data/mock-onboarding';
import { useOnboardingJob } from './onboarding-job-context';
import { config } from '@/lib/config';

interface ManualEntryFormProps {
  onBack: () => void;
}

/**
 * ManualEntryForm component that handles multi-step onboarding form.
 * Uses baseResumeDataSchema as the single source of truth.
 */
export function ManualEntryForm({ onBack }: ManualEntryFormProps) {
  const [currentStep, setCurrentStep] = useState<ManualEntryStep>('contact');
  const [direction, setDirection] = useState<1 | -1>(1);
  const { beginJob, isActive } = useOnboardingJob();
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );

  const form = useForm<OnboardingFormInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      version: 1,
      contact: {
        firstName: '',
        lastName: '',
        headline: null,
        email: '',
        phone: null,
        location: null,
        githubUrl: null,
        linkedinUrl: null,
        websiteUrl: null,
      },
      summary: null,
      experiences: [],
      projects: [],
      skills: [],
      education: [],
      certifications: [],
      languages: [],
    },
    mode: 'onSubmit',
  });

  const { mutate: startJob, isPending } = useActionMutation(
    (data: OnboardingFormInput) =>
      startOnboardingJobAction(data, idempotencyKey),
    {
      successMessage: 'Generating your resume…',
      onSuccess: (res) => {
        beginJob(res.jobId);
      },
      onSettled: () => setIdempotencyKey(crypto.randomUUID()),
      form,
    },
  );

  const currentIndex = MANUAL_STEPS.findIndex((s) => s.key === currentStep);

  const stepFields = useMemo(() => {
    switch (currentStep) {
      case 'contact':
        return ['contact'] as const;
      case 'summary':
        return ['summary'] as const;
      case 'experience':
        return ['experiences'] as const;
      case 'projects':
        return ['projects', 'skills'] as const;
      case 'education':
        return ['education'] as const;
      default:
        return [] as const;
    }
  }, [currentStep]);

  const goToNextStep = () => {
    if (currentIndex < MANUAL_STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(MANUAL_STEPS[currentIndex + 1].key);
    }
  };

  const goToPreviousStep = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentStep(MANUAL_STEPS[currentIndex - 1].key);
    } else {
      onBack();
    }
  };

  const handleNext = async () => {
    if (isPending || isActive) return;
    const ok = await form.trigger(stepFields, { shouldFocus: true });
    if (ok) goToNextStep();
  };

  const handleFinish = async () => {
    if (isPending || isActive) return;
    const ok = await form.trigger(undefined, { shouldFocus: true });
    if (!ok) return;
    const data = onboardingSchema.parse(form.getValues());
    startJob(data);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'contact':
        return <ContactStep onNext={handleNext} onBack={goToPreviousStep} />;
      case 'summary':
        return <SummaryStep onNext={handleNext} onBack={goToPreviousStep} />;
      case 'experience':
        return <ExperienceStep onNext={handleNext} onBack={goToPreviousStep} />;
      case 'projects':
        return <ProjectsStep onNext={handleNext} onBack={goToPreviousStep} />;
      case 'education':
        return (
          <EducationStep
            onFinish={handleFinish}
            onBack={goToPreviousStep}
            isLoading={isPending || isActive}
          />
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...form}>
      <Form
        className="flex min-h-[calc(100vh-100px)] flex-col"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {/* Header with back button and progress */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ProgressBar currentStep={currentStep} />
          <p className="text-muted-foreground mt-3 text-center text-xs">
            Required fields are marked with{' '}
            <span className="text-danger">*</span>
          </p>
        </motion.div>

        {/* Step Content with Animation */}
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </Form>
      {config.isDev && (
        <Button
          onClick={() => {
            form.reset(fillValues());
          }}
          className="fixed right-4 bottom-4"
        >
          Fill Values
        </Button>
      )}
    </FormProvider>
  );
}
