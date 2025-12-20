'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

const LOADING_STEPS = [
  'Initializing engine...',
  'Analyzing your unique career narrative...',
  'Structuring professional experience...',
  'Parsing project impact and tech stack...',
  'Canonicalizing skill categories...',
  'Optimizing summary for ATS compliance...',
  'Finalizing your base resume...',
];

export function GenerationOverlay({ isVisible }: { isVisible: boolean }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-background/95 fixed inset-0 z-100 flex items-center justify-center overflow-hidden backdrop-blur-xl"
        >
          {/* Enhanced Glowing Background Aura */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.5, 0.1],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="bg-primary/25 absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
            />
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.05, 0.3, 0.05],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
              className="bg-secondary/15 absolute top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[160px]"
            />
          </div>

          <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 text-center">
            {/* Core Glowing Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="group relative mb-10"
            >
              {/* Outer Glow Ring */}
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="bg-primary/30 absolute inset-0 -m-6 rounded-full blur-3xl"
              />

              <div className="bg-content1 relative flex h-24 w-24 items-center justify-center rounded-[32px] border border-white/10 shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)]">
                <Icon
                  icon="hugeicons:ai-brain-03"
                  className="text-primary relative z-10 h-12 w-12"
                />
              </div>
            </motion.div>

            {/* Static Header & Dynamic Status */}
            <div className="space-y-4">
              <h1 className="text-foreground from-foreground to-foreground/70 bg-linear-to-b bg-clip-text text-3xl font-bold tracking-tight">
                Creating your masterpiece
              </h1>

              <div className="flex h-8 items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stepIndex}
                    initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="text-default-500/80 text-lg font-medium"
                  >
                    {LOADING_STEPS[stepIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
