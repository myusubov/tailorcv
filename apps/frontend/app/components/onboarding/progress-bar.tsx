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
 * Onboarding progress stepper: shows step count, percentage, animated bar,
 * and step labels with completed/current state. Accessible and responsive.
 */
export function ProgressBar({ currentStep }: ProgressBarProps) {
  const currentIndex = MANUAL_STEPS.findIndex((s) => s.key === currentStep);
  const progress = ((currentIndex + 1) / MANUAL_STEPS.length) * 100;
  const currentStepConfig = MANUAL_STEPS[currentIndex];

  return (
    <nav
      className="w-full space-y-4"
      aria-label="Onboarding progress"
    >
      {/* Header: step count (primary) + percentage (secondary) + current step on mobile */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-foreground text-sm font-semibold">
            Step {currentIndex + 1} of {MANUAL_STEPS.length}
          </span>
          <span className="text-muted text-sm" aria-hidden>
            {Math.round(progress)}%
          </span>
        </div>
        {/* Show current step name on small screens where step pills are hidden */}
        {currentStepConfig && (
          <span
            className="text-muted text-xs sm:hidden"
            aria-hidden
          >
            {currentStepConfig.label}
          </span>
        )}
      </div>

      {/* Animated progress bar with ARIA for screen readers */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: step ${currentIndex + 1} of ${MANUAL_STEPS.length}, ${Math.round(progress)}% complete`}
        className="bg-surface h-2.5 w-full overflow-hidden rounded-full"
      >
        <motion.div
          className="bg-primary h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Step labels: full list on sm+, current step name shown in header on mobile */}
      <ol
        className="hidden gap-1 sm:flex"
        aria-label="Form steps"
      >
        {MANUAL_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <motion.li
              key={step.key}
              className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isCompleted
                  ? 'bg-primary/10 text-primary'
                  : isCurrent
                    ? 'bg-surface-secondary text-foreground ring-1 ring-border'
                    : 'text-muted'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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
                className={`size-4 shrink-0 ${isCompleted ? 'text-primary' : ''}`}
                aria-hidden
              />
              <span className="truncate">{step.label}</span>
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
}
