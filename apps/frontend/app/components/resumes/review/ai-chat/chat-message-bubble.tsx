import { useState } from 'react';
import { Button, cn, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ChatMessage } from '@/lib/types/ai-chat';
import { CodeBlock } from './code-block';
import { ProposalCard } from '@/app/components/ai-chat/proposal-card';
import { useAIChat } from '@/app/providers/ai-chat-provider';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  // Check if this is a "Thinking" state
  const isThinkingState = !isUser && message.isThinking;

  const { updateMessageStatus, applyUpdate, canApplyUpdate, currentResume } =
    useAIChat();

  // State to track if proposal was already applied or discarded
  const [proposalStatus, setProposalStatus] = useState<
    'pending' | 'applied' | 'discarded'
  >(message.status || 'pending');

  const handleCopy = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  /** Applies the AI proposal to the resume form and updates message status */
  const handleApply = () => {
    if (message.proposal && canApplyUpdate) {
      applyUpdate(message.proposal);
      setProposalStatus('applied');
      updateMessageStatus(message.id, 'applied');
    }
  };

  const handleDiscard = () => {
    setProposalStatus('discarded');
    updateMessageStatus(message.id, 'discarded');
  };

  if (isThinkingState) {
    return (
      <div className="w-full max-w-[85%] self-start pb-8">
        <div className="text-muted flex items-center gap-2">
          <Icon
            icon="solar:magic-stick-3-linear"
            className="size-4 animate-pulse"
          />
          <span className="text-sm">Drafting changes...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex w-full flex-col',
        isUser ? 'items-end' : 'items-start',
      )}
    >
      {/* 
        Standard Message Bubble: 
        Only shown for user messages OR assistant messages WITHOUT a proposal.
        Assistant messages WITH a proposal are handled entirely by ProposalCard.
      */}
      {(!message.proposal || isUser) && (
        <div
          className={cn(
            'wrap-break-words relative max-w-[85%] rounded-2xl text-sm leading-relaxed transition-all',
            isUser
              ? 'bg-accent text-accent-foreground px-3 py-2'
              : 'text-foreground pb-8',
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li>{children}</li>,
              h1: ({ children }) => (
                <h1 className="mb-2 text-lg font-bold last:mb-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-2 text-base font-bold last:mb-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-1 text-sm font-bold last:mb-0">{children}</h3>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {children}
                </a>
              ),
              code: (props) => {
                const { className, children, node } = props;
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match && !String(children).includes('\n');

                if (isInline) {
                  return (
                    <code
                      className={cn(
                        'rounded px-1.5 py-0.5 font-mono text-xs font-semibold',
                        isUser
                          ? 'bg-white/20'
                          : 'bg-default text-foreground',
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                return <CodeBlock isUser={isUser} {...props} />;
              },
              blockquote: ({ children }) => (
                <blockquote className="border-accent/50 text-muted mb-2 border-l-2 pl-3 italic last:mb-0">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="my-4 w-full overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
                  <table className="w-full text-left text-sm">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead
                  className={cn(
                    'border-b border-black/10 dark:border-white/10',
                    isUser ? 'bg-white/10' : 'bg-black/5 dark:bg-white/5',
                  )}
                >
                  {children}
                </thead>
              ),
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => (
                <tr className="border-b border-black/5 transition-colors last:border-0 hover:bg-black/5 dark:border-white/5 dark:hover:bg-white/5">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="px-4 py-2 font-semibold">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2 align-top">{children}</td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>

          {!isUser && (
            <div className="flex items-center gap-1">
              <Tooltip delay={300}>
                <Tooltip.Trigger>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'text-muted hover:text-foreground size-7',
                      isCopied &&
                        'bg-success-soft text-success-soft-foreground',
                    )}
                    onPress={handleCopy}
                    isDisabled={isCopied}
                    aria-label={isCopied ? 'Copied' : 'Copy response'}
                  >
                    <Icon
                      icon={
                        isCopied
                          ? 'solar:check-read-linear'
                          : 'solar:copy-linear'
                      }
                      className={cn(
                        'size-4 transition-transform',
                        isCopied && 'scale-110',
                      )}
                    />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content showArrow>
                  <Tooltip.Arrow />
                  <p className="text-xs font-medium">
                    {isCopied ? 'Copied!' : 'Copy response'}
                  </p>
                </Tooltip.Content>
              </Tooltip>
            </div>
          )}
        </div>
      )}

      {/* Render Proposal Card if available and pending */}
      {message.proposal && proposalStatus === 'pending' && (
        <ProposalCard
          proposal={message.proposal}
          originalData={currentResume || undefined}
          explanation={message.explanation || message.content}
          onApply={handleApply}
          onDiscard={handleDiscard}
          canApply={canApplyUpdate}
        />
      )}

      {/* Show status feedback */}
      {proposalStatus === 'applied' && (
        <div className="text-success mt-2 flex items-center gap-1.5 px-4 py-1 text-xs font-medium">
          <Icon icon="solar:check-circle-bold" className="size-4" />
          Changes applied to resume
        </div>
      )}

      {proposalStatus === 'discarded' && (
        <div className="text-muted mt-2 flex items-center gap-1.5 px-4 py-1 text-xs font-medium">
          <Icon icon="solar:trash-bin-trash-bold" className="size-4" />
          Proposal discarded
        </div>
      )}
    </div>
  );
}
