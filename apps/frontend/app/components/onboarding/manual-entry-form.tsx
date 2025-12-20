'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Form } from '@heroui/react';
import { ProgressBar } from './progress-bar';
import {
  ContactStep,
  SummaryStep,
  ExperienceStep,
  ProjectsStep,
  EducationStep,
} from './steps';
import { GenerationOverlay } from './generation-overlay';
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
import { ErrorCode } from 'shared';
import { toast } from 'sonner';

interface ManualEntryFormProps {
  onBack: () => void;
}

export function ManualEntryForm({
  onBack,
}: ManualEntryFormProps) {
  const [currentStep, setCurrentStep] = useState<ManualEntryStep>('education');
  const [direction, setDirection] = useState<1 | -1>(1);
  const router = useRouter();

  const form = useForm<OnboardingFormInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      contact: {
        fullName: 'Alex River',
        email: 'alex.river@example.com',
        phone: '+1 (555) 0123',
        location: 'San Francisco, CA',
        github: 'github.com/ariver',
        linkedin: 'linkedin.com/in/ariver',
        portfolio: 'ariver.dev',
      },
      summary:
        'Detail-oriented Full Stack Developer with 5 years of experience building scalable web applications. Expert in React, Node.js, and cloud architecture, with a passion for clean code and user-centric design.',
      experiences: [
        {
          id: 'e6b3605c-6c19-482b-87d3-74895c1c8764',
          jobTitle: 'Senior Software Engineer',
          company: 'TechFlow Systems',
          startMonth: '03',
          startYear: '2021',
          endMonth: '',
          endYear: '',
          isCurrent: true,
          description:
            'Leading the transition from a monolithic architecture to microservices using Next.js and Node.js. Optimized frontend performance, reducing Load Time by 40%.',
        },
        {
          id: '38d58547-49f2-436d-8869-ec85718a70f3',
          jobTitle: 'Frontend Developer',
          company: 'BrightEdge Agency',
          startMonth: '06',
          startYear: '2018',
          endMonth: '02',
          endYear: '2021',
          isCurrent: false,
          description:
            'Delivered 20+ responsive web applications for international clients. Implemented a shared UI component library that improved development speed by 30%.',
        },
      ],
      projects: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'TailorCV Platform',
          description:
            'An AI-powered career assistant that automates resume tailoring for specific job descriptions using LLMs.',
          techStack: 'Next.js 16, TypeScript, Tailwind CSS, Gemini API',
          link: 'https://github.com/ariver/tailorcv',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Distributed Task Runner',
          description:
            'A resilient background job processing system designed to handle millions of tasks per day.',
          techStack: 'Go, Redis, Docker, Kubernetes',
          link: 'https://github.com/ariver/task-runner',
        },
      ],
      skills: [
        'React',
        'Next.js',
        'TypeScript',
        'Node.js',
        'PostgreSQL',
        'Docker',
        'AWS',
        'GraphQL',
        'Tailwind CSS',
      ],
      education: {
        degree: 'B.S. in Computer Science',
        school: 'University of California, Berkeley',
        graduationYear: '2018',
        isSelfTaught: false,
      },
    },
    mode: 'onSubmit',
  });

  const { mutate, isPending } = useActionMutation(generateOnboardingAction, {
    successMessage: 'Resume generated successfully!',
    onSuccess: (res) => {
      // router.push(`/resumes/${res.baseResumeId}`);
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
    </FormProvider>
  );
}
