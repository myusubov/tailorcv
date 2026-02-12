'use client';

import { useRef, useState } from 'react';
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
  const [visibility, setVisibility] = useState<
    'auto' | 'both' | 'top' | 'bottom' | 'left' | 'right' | 'none'
  >('none');
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showLeft = visibility === 'left' || visibility === 'both';
  const showRight = visibility === 'right' || visibility === 'both';

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
            className="absolute top-1/2 left-1 z-30 -translate-y-1/2"
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
        className={cn(
          'flex w-full gap-2 overflow-x-auto scroll-smooth',
          scrollClassName,
        )}
        hideScrollBar
        onVisibilityChange={setVisibility}
        offset={10}
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
            className="absolute top-1/2 right-1 z-30 -translate-y-1/2"
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
