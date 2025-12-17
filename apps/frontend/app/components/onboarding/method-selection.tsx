'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button, Card, Chip } from '@heroui/react';
import type { OnboardingMethod } from '../../onboarding/types';

interface MethodSelectionProps {
  onSelectMethod: (method: OnboardingMethod) => void;
}

const methods = [
  {
    id: 'github' as const,
    icon: 'mdi:github',
    title: 'Connect GitHub',
    description: 'Auto-import your projects and skills',
    details: "We'll extract everything we can find",
    time: '~2 minutes',
    recommended: true,
  },
  {
    id: 'upload' as const,
    icon: 'lucide:upload',
    title: 'Upload About Me File',
    description: 'Upload .txt or .md with your info',
    details: 'Fastest if you have it ready',
    time: '~1 minute',
    recommended: false,
  },
  {
    id: 'manual' as const,
    icon: 'lucide:pen-line',
    title: 'Manual Entry',
    description: 'Fill in a simple form yourself',
    details: 'Complete control over your data',
    time: '~5 minutes',
    recommended: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export function MethodSelection({ onSelectMethod }: MethodSelectionProps) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center">
      <motion.div
        className="mb-10 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-500/20 to-blue-500/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Icon icon="lucide:sparkles" className="text-primary size-10" />
        </motion.div>
        <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome to TailorCV!
        </h1>
        <p className="text-muted mt-3 text-lg">
          Let&apos;s create your base resume in 2 minutes
        </p>
        <p className="text-muted mt-2 text-sm">
          Choose the fastest way to get started:
        </p>
      </motion.div>

      <motion.div
        className="flex w-full max-w-4xl flex-wrap gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {methods.map((method) => (
          <motion.div
            key={method.id}
            variants={itemVariants}
            className="min-w-[18rem] flex-1"
          >
            <Card className="group relative p-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
              <button
                type="button"
                onClick={() => onSelectMethod(method.id)}
                className="flex w-full flex-col p-6 text-left"
              >
                {method.recommended && (
                  <Chip
                    className="border-primary/30 bg-primary/10 text-primary absolute top-3 right-3 text-xs"
                    size="md"
                  >
                    Recommended
                  </Chip>
                )}

                <div
                  className={`mb-4 flex size-12 items-center justify-center rounded-xl transition-colors ${
                    method.recommended
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-tertiary text-foreground'
                  }`}
                >
                  <Icon icon={method.icon} className="size-6" />
                </div>

                <Card.Header className="p-0">
                  <Card.Title className="text-lg">{method.title}</Card.Title>
                  <Card.Description className="mt-1.5 text-sm">
                    {method.description}
                  </Card.Description>
                </Card.Header>

                <p className="text-muted mt-2 text-xs">{method.details}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-muted flex items-center gap-1.5 text-xs">
                    <Icon icon="lucide:clock" className="size-3.5" />
                    <span>Takes {method.time}</span>
                  </div>
                  <Icon
                    icon="lucide:arrow-right"
                    className="text-muted size-4 transition-transform group-hover:translate-x-1"
                  />
                </div>
              </button>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* <motion.div
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          variant="ghost"
          className="text-muted hover:text-foreground"
          onPress={() => onSelectMethod(null)}
        >
          Skip for now
          <Icon icon="lucide:arrow-right" className="ml-1 size-4" />
        </Button>
      </motion.div> */}
    </div>
  );
}
