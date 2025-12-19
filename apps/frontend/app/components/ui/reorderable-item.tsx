'use client';

import { useRef, useState } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Button, Tooltip, cn } from '@heroui/react';
import { Icon } from '@iconify/react';

interface ReorderableItemProps extends HTMLMotionProps<'div'> {
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  children: React.ReactNode;
}

export function ReorderableItem({
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  children,
  className,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ReorderableItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
    onMouseEnter?.(event);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => setIsHovered(false), 150);
    onMouseLeave?.(event);
  };

  return (
    <motion.div
      layout
      className={cn('relative', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Floating Controls */}
      <div
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          setIsHovered(true);
        }}
        className={cn(
          'absolute top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2 p-4 transition-all duration-300 ease-out lg:flex',
          isHovered
            ? 'pointer-events-auto -right-17 opacity-100'
            : 'pointer-events-none right-0 opacity-0',
        )}
      >
        <Tooltip delay={150}>
          <Button
            onPress={onMoveUp}
            isDisabled={isFirst}
            isIconOnly
            variant="tertiary"
            size="sm"
            className="group"
          >
            <Icon
              icon="lucide:arrow-up"
              className="transition-transform group-hover:-translate-y-1"
            />
          </Button>
          <Tooltip.Content showArrow placement="right">
            Move up
          </Tooltip.Content>
        </Tooltip>
        <Tooltip delay={150}>
          <Button
            onPress={onMoveDown}
            isDisabled={isLast}
            isIconOnly
            variant="tertiary"
            size="sm"
            className="group"
          >
            <Icon
              icon="lucide:arrow-down"
              className="transition-transform group-hover:translate-y-1"
            />
          </Button>
          <Tooltip.Content showArrow placement="right">
            Move down
          </Tooltip.Content>
        </Tooltip>
      </div>

      {children}
    </motion.div>
  );
}
