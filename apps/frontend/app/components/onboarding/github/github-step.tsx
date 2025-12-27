'use client';

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface GitHubStepProps {
  onBack: () => void;
}

export function GitHubStep({ onBack }: GitHubStepProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="bg-surface-secondary mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl">
          <Icon icon="mdi:github" className="size-10" />
        </div>
        <h2 className="text-foreground text-2xl font-bold">Connect GitHub</h2>
        <p className="text-muted mt-2">GitHub integration coming soon...</p>
        <Button variant="tertiary" onPress={onBack} className="mt-6">
          <Icon icon="lucide:arrow-left" className="mr-2" />
          Back to methods
        </Button>
      </motion.div>
    </div>
  );
}
