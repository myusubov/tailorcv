import { useState } from 'react';
import { Button, cn, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ChatMessage } from '@/lib/types/ai-chat';
import { CodeBlock } from './code-block';
import { ProposalCard } from '@/app/components/ai-chat/proposal-card';
import { ResumeFormContext } from '@/app/components/resumes/review/resume-form-context';
import { useContext } from 'react';

import { useAIChat } from '@/app/providers/ai-chat-provider';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);

  const resumeContext = useContext(ResumeFormContext);
  const { updateMessageStatus } = useAIChat();
  const applyUpdate = resumeContext?.applyUpdate;

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

  const handleApply = () => {
    if (message.proposal && applyUpdate) {
      applyUpdate(message.proposal);
      setProposalStatus('applied');
      updateMessageStatus(message.id, 'applied');
    }
  };

  const handleDiscard = () => {
    setProposalStatus('discarded');
    updateMessageStatus(message.id, 'discarded');
  };

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
              ? 'bg-primary text-primary-foreground px-3 py-2'
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
                  className="text-primary hover:underline"
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
                          : 'bg-default-200 text-foreground',
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
                <blockquote className="border-primary/50 text-muted-foreground mb-2 border-l-2 pl-3 italic last:mb-0">
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
                      'text-muted-foreground hover:text-foreground size-7',
                      isCopied && 'text-success bg-success/10',
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
          originalData={resumeContext?.form.getValues()}
          explanation={message.explanation || message.content}
          onApply={handleApply}
          onDiscard={handleDiscard}
          canApply={!!applyUpdate}
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
        <div className="text-default-400 mt-2 flex items-center gap-1.5 px-4 py-1 text-xs font-medium">
          <Icon icon="solar:trash-bin-trash-bold" className="size-4" />
          Proposal discarded
        </div>
      )}
    </div>
  );
}
