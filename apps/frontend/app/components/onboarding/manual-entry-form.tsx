'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button, Form } from '@heroui/react';
import { ProgressBar } from './progress-bar';
import {
  ContactStep,
  SummaryStep,
  ExperienceStep,
  ProjectsStep,
  EducationStep,
} from './steps';
import { GenerationOverlay, SuccessModal } from './index';
import type { ManualEntryStep } from '../../onboarding/types';
import { MANUAL_STEPS } from '../../onboarding/types';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  onboardingSchema,
  type OnboardingFormInput,
  type OnboardingFormValues,
} from '@/lib/schemas/onboarding';
import { useActionMutation } from '@/lib/hooks/use-action-mutation';
import { generateOnboardingAction } from '@/lib/actions/onboarding.actions';
import type { GenerateOnboardingOutput } from '@/lib/types/onboarding';
import { fillValues } from '@/lib/data/mock-onboarding';

interface ManualEntryFormProps {
  onBack: () => void;
}

export function ManualEntryForm({ onBack }: ManualEntryFormProps) {
  const [currentStep, setCurrentStep] = useState<ManualEntryStep>('contact');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedData, setGeneratedData] =
    useState<GenerateOnboardingOutput | null>(null);
  const router = useRouter();

  const form = useForm<OnboardingFormInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      contact: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        github: '',
        linkedin: '',
        portfolio: '',
      },
      summary: '',
      experiences: [],
      projects: [],
      skills: [],
      education: {
        degree: '',
        school: '',
        graduationYear: '',
        isSelfTaught: false,
      },
    },
    mode: 'onSubmit',
  });

  const { mutate, isPending } = useActionMutation(generateOnboardingAction, {
    successMessage: 'Resume generated successfully!',
    onSuccess: (res) => {
      setGeneratedData(res);
      console.log(res);
      setShowSuccessModal(true);
    },
    form,
  });

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
    const ok = await form.trigger(stepFields, { shouldFocus: true });
    if (ok) goToNextStep();
  };

  const handleFinish = async () => {
    const ok = await form.trigger(undefined, { shouldFocus: true });
    if (!ok) return;
    const data = onboardingSchema.parse(form.getValues());
    mutate(data);
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
            isLoading={isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...form}>
      <Form className="flex min-h-[calc(100vh-100px)] flex-col">
        {/* Header with back button and progress */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ProgressBar currentStep={currentStep} />
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
      <GenerationOverlay isVisible={isPending} />
      <SuccessModal
        isOpen={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        data={generatedData}
      />
      <Button onClick={() => {
        form.reset(fillValues())
      }} className="fixed bottom-4 right-4">Fill Values</Button>
    </FormProvider>
  );
}
