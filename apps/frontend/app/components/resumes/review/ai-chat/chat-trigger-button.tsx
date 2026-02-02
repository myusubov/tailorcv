'use client';

import { Tooltip, Button, cn } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface ChatTriggerButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function ChatTriggerButton({
  isExpanded,
  onToggle,
}: ChatTriggerButtonProps) {
  return (
    <Tooltip delay={300}>
      <Tooltip.Trigger>
        <motion.div
          initial={false}
          animate={{
            scale: isExpanded ? 0 : 1,
            opacity: isExpanded ? 0 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(isExpanded && 'pointer-events-none')}
        >
          <Button
            isIconOnly
            variant="tertiary"
            onPress={onToggle}
            className={cn(
              'size-14 rounded-full shadow-xl transition-all duration-300',
              'hover:-translate-y-1 hover:shadow-2xl active:scale-95',
            )}
            aria-label="Open AI Assistant"
          >
            <Icon icon="solar:stars-bold" className="size-6" />
          </Button>
        </motion.div>
      </Tooltip.Trigger>
      <Tooltip.Content placement="left">
        <p className="font-medium">AI Assistant</p>
      </Tooltip.Content>
    </Tooltip>
  );
}
