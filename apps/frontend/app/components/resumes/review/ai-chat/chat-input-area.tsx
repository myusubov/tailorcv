'use client';

import { Button, cn, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface ChatInputAreaProps {
  input: string;
  isTyping: boolean;
  isInputFullscreen: boolean;
  contextName?: string | null;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggleInputFullscreen: () => void;
  canStopResponse: boolean;
  stopResponse: () => void;
}

export function ChatInputArea({
  input,
  isTyping,
  isInputFullscreen,
  contextName,
  inputRef,
  onInputChange,
  onSend,
  onKeyDown,
  onToggleInputFullscreen,
  canStopResponse,
  stopResponse,
}: ChatInputAreaProps) {
  return (
    <motion.div
      layout="position"
      transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }}
      className={cn(
        'bg-surface p-3 shadow-inner',
        isInputFullscreen
          ? 'absolute inset-0 z-50 p-4'
          : 'border-separator relative border-t',
      )}
    >
      <div
        className={cn(
          'border-border bg-surface-secondary relative flex w-full flex-col gap-1 rounded-xl border p-1.5',
          isInputFullscreen ? 'h-full items-stretch' : 'items-stretch',
        )}
      >
        {contextName && !isInputFullscreen && (
          <div className="flex px-1.5 pt-1">
            <Tooltip delay={300}>
              <Tooltip.Trigger>
                <div className="bg-accent/10 border-accent/20 text-accent hover:bg-accent/20 flex cursor-help items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors">
                  <Icon icon="solar:document-bold" className="size-3" />
                  <span>{contextName}</span>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p className="max-w-xs text-xs leading-relaxed font-medium">
                  The AI is currently using this document as context for its
                  suggestions and edits.
                </p>
              </Tooltip.Content>
            </Tooltip>
          </div>
        )}

        <div
          className={cn(
            'flex flex-1 items-stretch gap-2',
            isInputFullscreen ? 'flex-col' : 'flex-row items-end',
          )}
        >
          <textarea
            ref={inputRef}
            rows={isInputFullscreen ? 12 : input.length > 80 ? 4 : 1}
            placeholder="Ask AI to edit your resume..."
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            className={cn(
              'text-foreground placeholder:text-muted flex-1 resize-none bg-transparent px-2.5 py-2 text-sm focus:outline-none',
              isInputFullscreen
                ? 'h-full max-h-none text-base'
                : 'max-h-24 min-h-9',
            )}
          />
          <div
            className={cn(
              'flex items-center gap-1.5',
              isInputFullscreen
                ? 'justify-end border-t border-white/10 pt-2'
                : 'pb-0.5',
            )}
          >
            <Tooltip delay={300}>
              <Tooltip.Trigger>
                <Button
                  isIconOnly
                  size="sm"
                  className="text-muted hover:text-foreground"
                  variant="ghost"
                  onPress={onToggleInputFullscreen}
                  aria-label={
                    isInputFullscreen ? 'Minimize Input' : 'Expand Input'
                  }
                >
                  <Icon
                    icon={
                      isInputFullscreen
                        ? 'solar:minimize-linear'
                        : 'solar:maximize-linear'
                    }
                    width={18}
                  />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content showArrow>
                <Tooltip.Arrow />
                <p className="text-xs font-medium">
                  {isInputFullscreen ? 'Minimize prompt' : 'Expand prompt area'}
                </p>
              </Tooltip.Content>
            </Tooltip>

            {canStopResponse ? (
              // Stop button (shown when AI is streaming)
              <Tooltip delay={300}>
                <Tooltip.Trigger>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    onPress={stopResponse}
                    aria-label="Stop generating"
                  >
                    <motion.div
                    >
                      <Icon icon="solar:stop-circle-bold" width={20} />
                    </motion.div>
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content showArrow>
                  <Tooltip.Arrow />
                  <p className="text-xs font-medium">Stop generating</p>
                </Tooltip.Content>
              </Tooltip>
            ) : (
              // Send button (shown when not streaming)
              <Button
                isIconOnly
                size="sm"
                onPress={onSend}
                isDisabled={!input.trim() || isTyping}
                className={cn(
                  input.trim() && !isTyping
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-default text-muted',
                )}
                aria-label="Send message"
              >
                <Icon icon="solar:arrow-up-linear" width={18} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
