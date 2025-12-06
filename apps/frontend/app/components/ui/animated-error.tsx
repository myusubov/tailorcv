'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface AnimatedErrorProps {
  message: string | null | undefined;
  className?: string;
  icon?: string;
}

export function AnimatedError({
  message,
  className = '',
  icon = 'lucide:alert-circle',
}: AnimatedErrorProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  const measureHeight = useCallback(() => {
    if (contentRef.current) {
      // Use requestAnimationFrame to ensure measurement happens after paint
      requestAnimationFrame(() => {
        if (contentRef.current) {
          const measuredHeight = contentRef.current.offsetHeight;
          setHeight(measuredHeight);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (message) {
      // Measure after a microtask to ensure content is rendered
      queueMicrotask(() => {
        measureHeight();
      });

      // Also set up ResizeObserver for dynamic content changes
      const resizeObserver = new ResizeObserver(() => {
        measureHeight();
      });

      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    } else {
      setHeight(0);
    }
  }, [message, measureHeight]);

  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height }}
          exit={{ opacity: 0, height: 0 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
            height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            opacity: { duration: 0.2 },
          }}
          className={`overflow-hidden ${className}`}
        >
          <div
            ref={contentRef}
            className="bg-danger-50 text-danger flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
          >
            <Icon icon={icon} className="size-4 shrink-0" />
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AnimatedError;
