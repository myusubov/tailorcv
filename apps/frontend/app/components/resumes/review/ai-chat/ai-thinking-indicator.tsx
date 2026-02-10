'use client';

import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Skeleton } from '@heroui/react';

/**
 * Compact version for inline use or smaller spaces
 */
export function AIThinkingIndicatorCompact() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex items-center gap-3 py-1"
    >
      {/* Icon Orb */}
      <motion.div 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1 
        }}
        className="relative flex size-8 shrink-0 items-center justify-center"
      >
        <motion.div
          className="absolute inset-0 rounded-full opacity-50 blur-sm"
          style={{
            background:
              'conic-gradient(from 0deg, #ec4899, #8b5cf6, #3b82f6, #06b6d4, #10b981, #eab308, #f97316, #ef4444, #ec4899)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <div className="bg-background relative z-10 flex size-[95%] items-center justify-center rounded-full">
          <motion.div
            animate={{ 
              opacity: [0.4, 1, 0.4],
              scale: [0.95, 1.05, 0.95]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Icon
              icon="solar:magic-stick-3-bold-duotone"
              className="size-4 text-indigo-500"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Skeleton Text Lines - Growing on mount */}
      <div className="flex min-w-[140px] flex-col gap-1.5">
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <Skeleton className="h-2 w-full rounded-full" />
        </motion.div>
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '60%', opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.35 }}
        >
          <Skeleton className="h-2 w-full rounded-full" />
        </motion.div>
      </div>
    </motion.div>
  );
}
