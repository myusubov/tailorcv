'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MANUAL_STEPS, type ManualEntryStep } from '../../onboarding/types';

interface ProgressBarProps {
  currentStep: ManualEntryStep;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const currentIndex = MANUAL_STEPS.findIndex((s) => s.key === currentStep);
  const progress = ((currentIndex + 1) / MANUAL_STEPS.length) * 100;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-muted text-sm font-medium">
          Step {currentIndex + 1} of {MANUAL_STEPS.length}
        </span>
        <span className="text-muted text-sm">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="bg-surface-secondary h-2 w-full overflow-hidden rounded-full">
        <motion.div
          className="bg-primary h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="hidden gap-1 sm:flex">
        {MANUAL_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <motion.div
              key={step.key}
              className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isCompleted
                  ? 'bg-primary/10 text-primary'
                  : isCurrent
                    ? 'bg-surface-secondary text-foreground'
                    : 'text-muted'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Icon
                icon={isCompleted ? 'lucide:check-circle' : step.icon}
                className={`size-4 flex-shrink-0 ${isCompleted ? 'text-primary' : ''}`}
              />
              <span className="hidden truncate lg:block">{step.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
