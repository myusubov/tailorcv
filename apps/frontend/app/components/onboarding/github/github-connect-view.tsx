'use client';

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface GitHubConnectViewProps {
  isConnecting: boolean;
  onConnect: () => void;
  onBack: () => void;
}

export function GitHubConnectView({
  isConnecting,
  onConnect,
  onBack,
}: GitHubConnectViewProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Header Section */}
        <div className="mb-8 text-center">
          <motion.div
            className="relative mx-auto mb-5 flex size-20 items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className="bg-surface-secondary flex size-16 items-center justify-center rounded-2xl shadow-lg">
              <Icon icon="mdi:github" className="text-foreground size-9" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="bg-primary/10 text-primary mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase">
              Built from your engineering work
            </span>
          </motion.div>

          <motion.h1
            className="text-foreground text-balance text-3xl font-bold tracking-tight sm:text-4xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Turn your repositories into resume proof
          </motion.h1>

          <motion.p
            className="text-muted-foreground mx-auto mt-4 max-w-xl text-base leading-relaxed text-balance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            TailorCV will use selected repositories, languages, commits, pull
            requests, and project structure to help draft resume content
            grounded in real work instead of generic project summaries.
          </motion.p>
        </div>

        {/* Repository Evidence Section */}
        <motion.div
          className="bg-surface border-border mb-8 rounded-2xl border p-5 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-foreground mb-4 text-sm font-semibold">
            What GitHub can reveal
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: 'lucide:code-2',
                title: 'Programming languages',
                description: 'Frameworks and tools you use in real projects',
              },
              {
                icon: 'lucide:folder-tree',
                title: 'Project structure',
                description: 'Scope, architecture, and implementation depth',
              },
              {
                icon: 'lucide:git-pull-request',
                title: 'Commits and PRs',
                description: 'Signals from how you build and collaborate',
              },
              {
                icon: 'lucide:trending-up',
                title: 'Shipped work',
                description: 'Concrete material for stronger resume bullets',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="flex items-start gap-3 rounded-xl p-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <div className="bg-primary/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <Icon icon={item.icon} className="text-primary size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-medium">
                    {item.title}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-sm leading-snug">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Button
            variant="ghost"
            onPress={onBack}
            isDisabled={isConnecting}
            className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
          >
            <Icon icon="lucide:arrow-left" className="size-4" />
            Choose a different method
          </Button>

          <Button
            size="lg"
            isDisabled={isConnecting}
            variant="primary"
            onPress={onConnect}
          >
            <Icon
              icon={
                isConnecting ? 'line-md:loading-twotone-loop' : 'mdi:github'
              }
              className="size-5"
            />
            {isConnecting ? 'Connecting...' : 'Connect GitHub Account'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
