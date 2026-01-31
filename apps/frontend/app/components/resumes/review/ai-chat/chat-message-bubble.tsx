'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@heroui/react';
import { ChatMessage } from '@/lib/types/ai-chat';
import { CodeBlock } from './code-block';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'wrap-break-words max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-content2 text-foreground', // content2 is a cleaner "paper" background in HeroUI
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Paragraphs: Add spacing but remove margin from last element
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

            // Lists: Add proper spacing and indentation
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

            // Headings: Make them bold and distinct
            h1: ({ children }) => (
              <h1 className="mb-2 text-lg font-bold last:mb-0">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-2 text-base font-bold last:mb-0">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-1 text-sm font-bold last:mb-0">{children}</h3>
            ),

            // Text Styles
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

            // Code Blocks: distinct styling for inline vs block
            code: (props) => {
              const { className, children, node } = props;
              const match = /language-(\w+)/.exec(className || '');
              // Check if it's an inline code block (no newlines in children usually suggests inline if no language set)
              const isInline = !match && !String(children).includes('\n');

              if (isInline) {
                return (
                  <code
                    className={cn(
                      'rounded px-1.5 py-0.5 font-mono text-xs font-semibold',
                      isUser ? 'bg-white/20' : 'bg-default-200 text-foreground',
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                );
              }

              return <CodeBlock isUser={isUser} {...props} />;
            },

            // Quotes
            blockquote: ({ children }) => (
              <blockquote className="border-primary/50 text-muted-foreground mb-2 border-l-2 pl-3 italic last:mb-0">
                {children}
              </blockquote>
            ),

            // Tables
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
      </div>
    </div>
  );
}
