'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button, ScrollShadow, cn } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
  scrollClassName?: string;
}

/**
 * A reusable horizontal scroll container with native HeroUI navigation controls.
 * Controls appear only on hover and when scrolling is possible.
 */
export function HorizontalScroll({
  children,
  className,
  scrollClassName,
}: HorizontalScrollProps) {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Updates the visibility state of navigation buttons based on scroll position.
   */
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = el;
    
    // Threshold for showing buttons to avoid jitter
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  // Re-check when children change
  useEffect(() => {
    const timeout = setTimeout(checkScroll, 100);
    return () => clearTimeout(timeout);
  }, [children, checkScroll]);

  /**
   * Handles smooth scrolling.
   */
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth * 0.7;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div
      className={cn('relative w-full', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && showLeft && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1 z-30 top-1/2 -translate-y-1/2"
          >
            <Button
              isIconOnly
              size="sm"
              variant="tertiary"
              onPress={() => handleScroll('left')}
              aria-label="Scroll left"
            >
              <Icon icon="lucide:chevron-left" width={18} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollShadow
        ref={scrollRef}
        orientation="horizontal"
        className={cn('flex w-full overflow-x-auto gap-2 scroll-smooth', scrollClassName)}
        hideScrollBar
        onScroll={checkScroll}
        size={40}
      >
        {children}
      </ScrollShadow>

      <AnimatePresence>
        {isHovered && showRight && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute right-1 z-30 top-1/2 -translate-y-1/2"
          >
            <Button
              isIconOnly
              size="sm"
              variant="tertiary"
              onPress={() => handleScroll('right')}
              aria-label="Scroll right"
            >
              <Icon icon="lucide:chevron-right" width={18} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
