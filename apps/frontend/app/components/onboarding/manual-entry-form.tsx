'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ProgressBar } from './progress-bar';
import {
  ContactStep,
  SummaryStep,
  ExperienceStep,
  ProjectsStep,
  EducationStep,
} from './steps';
import type {
  ManualEntryStep,
  OnboardingFormData,
  ContactInfo,
  Experience,
  Project,
  Education,
} from '../../onboarding/types';
import { MANUAL_STEPS } from '../../onboarding/types';

interface ManualEntryFormProps {
  onBack: () => void;
  onComplete: (data: OnboardingFormData) => void;
}

const initialContactInfo: ContactInfo = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  github: '',
  linkedin: '',
  portfolio: '',
};

const initialEducation: Education = {
  degree: '',
  school: '',
  graduationYear: '',
  isSelfTaught: false,
};

export function ManualEntryForm({ onBack, onComplete }: ManualEntryFormProps) {
  const [currentStep, setCurrentStep] = useState<ManualEntryStep>('contact');
  const [formData, setFormData] = useState<OnboardingFormData>({
    contact: initialContactInfo,
    summary: '',
    experiences: [],
    projects: [],
    skills: [],
    education: initialEducation,
  });

  const currentIndex = MANUAL_STEPS.findIndex((s) => s.key === currentStep);

  const goToNextStep = () => {
    if (currentIndex < MANUAL_STEPS.length - 1) {
      setCurrentStep(MANUAL_STEPS[currentIndex + 1].key);
    }
  };

  const goToPreviousStep = () => {
    if (currentIndex > 0) {
      setCurrentStep(MANUAL_STEPS[currentIndex - 1].key);
    } else {
      onBack();
    }
  };

  const handleFinish = () => {
    onComplete(formData);
  };

  const updateContact = (contact: ContactInfo) => {
    setFormData((prev) => ({ ...prev, contact }));
  };

  const updateSummary = (summary: string) => {
    setFormData((prev) => ({ ...prev, summary }));
  };

  const updateExperiences = (experiences: Experience[]) => {
    setFormData((prev) => ({ ...prev, experiences }));
  };

  const updateProjects = (projects: Project[]) => {
    setFormData((prev) => ({ ...prev, projects }));
  };

  const updateSkills = (skills: string[]) => {
    setFormData((prev) => ({ ...prev, skills }));
  };

  const updateEducation = (education: Education) => {
    setFormData((prev) => ({ ...prev, education }));
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
        return (
          <ContactStep
            data={formData.contact}
            onChange={updateContact}
            onNext={goToNextStep}
          />
        );
      case 'summary':
        return (
          <SummaryStep
            data={formData.summary}
            onChange={updateSummary}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'experience':
        return (
          <ExperienceStep
            data={formData.experiences}
            onChange={updateExperiences}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'projects':
        return (
          <ProjectsStep
            projects={formData.projects}
            skills={formData.skills}
            onProjectsChange={updateProjects}
            onSkillsChange={updateSkills}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'education':
        return (
          <EducationStep
            data={formData.education}
            onChange={updateEducation}
            onFinish={handleFinish}
            onBack={goToPreviousStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col">
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
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
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
    </div>
  );
}
