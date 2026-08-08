'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

interface StepHeaderProps {
  icon: string;
  title: string;
  description: string;
}

export function StepHeader({ icon, title, description }: StepHeaderProps) {
  return (
    <motion.div
      className="mb-8 text-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="bg-accent/10 text-accent mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Icon icon={icon} className="size-7" />
      </motion.div>
      <motion.h2
        className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {title}
      </motion.h2>
      <motion.p
        className="text-muted mt-2 text-base text-balance"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {description}
      </motion.p>
    </motion.div>
  );
}
