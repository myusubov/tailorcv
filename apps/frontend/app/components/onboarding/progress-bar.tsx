'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MANUAL_STEPS, type ManualEntryStep } from '../../onboarding/types';

/** Props for the onboarding step progress indicator. */
interface ProgressBarProps {
  /** Current step key; progress and labels update from this. */
  currentStep: ManualEntryStep;
}

/**
 * Onboarding progress stepper for the manual entry flow.
 *
 * Shows a compact current-step summary on mobile and a non-interactive
 * labeled stepper on larger screens. The component communicates completed,
 * current, and upcoming steps without duplicate percentage or progress bar UI.
 */
export function ProgressBar({ currentStep }: ProgressBarProps) {
  const currentIndex = MANUAL_STEPS.findIndex((s) => s.key === currentStep);

  if (currentIndex === -1) {
    console.warn('Invalid onboarding currentStep supplied to ProgressBar', {
      currentStep,
    });
    return null;
  }

  const currentStepConfig = MANUAL_STEPS[currentIndex];
  const currentStepNumber = currentIndex + 1;

  return (
    <nav className="w-full" aria-label="Onboarding progress">
      <div className="border-border bg-surface-secondary/70 mb-4 rounded-lg border px-4 py-3 sm:hidden">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs font-medium">
            Step {currentStepNumber}
          </span>
          <span className="text-muted-foreground text-xs font-medium">
            {currentStepNumber}/{MANUAL_STEPS.length}
          </span>
        </div>
        <div className="text-foreground flex items-center gap-2 text-base font-semibold">
          <Icon
            icon={currentStepConfig.icon}
            className="text-primary size-5 shrink-0"
            aria-hidden
          />
          <span>{currentStepConfig.label}</span>
        </div>
      </div>

      <ol
        className="hidden flex-wrap justify-center gap-2 sm:flex"
        aria-label="Form steps"
      >
        {MANUAL_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <motion.li
              key={step.key}
              className={`flex w-fit items-center justify-start gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isCompleted
                  ? 'bg-primary/10 text-primary'
                  : isCurrent
                    ? 'border-border bg-surface-secondary text-foreground border'
                    : 'text-muted-foreground bg-surface/70'
              }`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={
                isCompleted
                  ? `${step.label}, completed`
                  : isCurrent
                    ? `${step.label}, current step`
                    : step.label
              }
            >
              <Icon
                icon={isCompleted ? 'lucide:check-circle' : step.icon}
                className={`size-4 shrink-0 ${isCompleted || isCurrent ? 'text-primary' : ''}`}
                aria-hidden
              />
              <span className="truncate">{step.label}</span>
            </motion.li>
          );
        })}
      </ol>

      <span className="sr-only">
        Step {currentStepNumber} of {MANUAL_STEPS.length}:{' '}
        {currentStepConfig.label}
      </span>
    </nav>
  );
}
