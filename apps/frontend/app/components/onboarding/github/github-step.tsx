'use client';

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface GitHubStepProps {
  onBack: () => void;
}

export function GitHubStep({ onBack }: GitHubStepProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Header Section */}
        <div className="mb-10 text-center">
          <motion.div
            className="relative mx-auto mb-8 flex size-24 items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className="bg-surface-secondary flex size-20 items-center justify-center rounded-2xl shadow-xl">
              <Icon icon="mdi:github" className="text-foreground size-10" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase">
              Built for Engineers
            </span>
          </motion.div>

          <motion.h1
            className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Your Code Tells a Story
          </motion.h1>

          <motion.p
            className="text-muted mx-auto mt-4 max-w-md text-base leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            We analyze your commits, PRs, and contributions to generate
            high-impact resume bullets that recruiters actually care about.
          </motion.p>
        </div>

        {/* What We Extract Section */}
        <motion.div
          className="bg-surface border-border mb-8 rounded-2xl border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-foreground mb-4 text-sm font-semibold">
            What we extract from your repositories:
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: 'lucide:git-commit', text: 'Commit messages & patterns' },
              {
                icon: 'lucide:git-pull-request',
                text: 'PR descriptions & reviews',
              },
              { icon: 'lucide:package', text: 'Tech stack from package.json' },
              {
                icon: 'lucide:trending-up',
                text: 'Impact & contribution metrics',
              },
            ].map((item, index) => (
              <motion.div
                key={item.text}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                  <Icon icon={item.icon} className="text-primary size-4" />
                </div>
                <span className="text-muted text-sm">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Button
            size="lg"
            onPress={() => {}} // TODO: Add GitHub OAuth Handler
            className="bg-foreground text-background hover:bg-foreground/90 w-full max-w-sm px-8 py-6 text-base font-semibold shadow-xl transition-all hover:scale-[1.02]"
          >
            <Icon icon="mdi:github" className="mr-2 size-5" />
            Connect GitHub Account
          </Button>

          <p className="text-muted flex items-center gap-2 text-xs">
            <Icon icon="lucide:lock" className="size-3" />
            Read-only access. We never modify your repositories.
          </p>

          <Button
            variant="ghost"
            onPress={onBack}
            className="text-muted hover:text-foreground mt-2"
          >
            <Icon icon="lucide:arrow-left" className="size-4" />
            Choose a different method
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
