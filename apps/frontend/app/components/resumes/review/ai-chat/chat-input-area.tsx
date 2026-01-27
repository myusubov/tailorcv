'use client';

import { Button, cn, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface ChatInputAreaProps {
  input: string;
  isTyping: boolean;
  isInputFullscreen: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggleInputFullscreen: () => void;
}

export function ChatInputArea({
  input,
  isTyping,
  isInputFullscreen,
  inputRef,
  onInputChange,
  onSend,
  onKeyDown,
  onToggleInputFullscreen,
}: ChatInputAreaProps) {
  return (
    <motion.div
      layout="position"
      transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
      className={cn(
        "border-separator border-t p-3 bg-content1 shadow-inner",
        isInputFullscreen ? "absolute inset-0 z-50 p-4 rounded-3xl" : "relative"
      )}
    >
      <div className={cn(
        "border-border bg-content2 relative flex w-full gap-2 rounded-xl border p-1.5",
        isInputFullscreen ? "h-full flex-col items-stretch" : "items-end"
      )}>
        <textarea
          ref={inputRef}
          rows={isInputFullscreen ? 12 : 1}
          placeholder="Ask AI to edit your resume..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          className={cn(
            "text-foreground placeholder:text-muted flex-1 resize-none bg-transparent px-2.5 py-2 text-sm focus:outline-none",
            isInputFullscreen ? "h-full max-h-none text-base" : "max-h-24 min-h-[36px]"
          )}
        />
        <div className={cn(
          "flex items-center gap-1.5",
          isInputFullscreen ? "justify-end border-t border-white/10 pt-2" : "pb-0.5"
        )}>
          <Tooltip delay={300}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={onToggleInputFullscreen}
                className="size-9 rounded-lg border-none hover:bg-default transition-transform active:scale-90"
                aria-label={isInputFullscreen ? "Minimize Input" : "Expand Input"}
              >
                <Icon
                  icon={isInputFullscreen ? "solar:minimize-linear" : "solar:maximize-linear"}
                  width={18}
                />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow>
              <Tooltip.Arrow />
              <p className="text-xs font-medium">{isInputFullscreen ? "Minimize prompt" : "Expand prompt area"}</p>
            </Tooltip.Content>
          </Tooltip>

          <Button
            isIconOnly
            size="sm"
            onPress={onSend}
            isDisabled={!input.trim() || isTyping}
            className={cn(
              'size-9 shrink-0 rounded-lg transition-all active:scale-95',
              input.trim() && !isTyping
                ? 'bg-accent text-accent-foreground'
                : 'bg-default text-muted',
            )}
            aria-label="Send message"
          >
            <Icon icon="solar:arrow-up-linear" width={18} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
