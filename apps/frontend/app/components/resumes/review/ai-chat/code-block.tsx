'use client';

import { useState } from 'react';
import { cn } from '@heroui/react';
import { Icon } from '@iconify/react';

export interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  isUser?: boolean;
  [key: string]: any;
}

export function CodeBlock({
  className,
  children,
  isUser,
  ...props
}: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  // Extract language from class name (e.g., "language-typescript")
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] || 'text';
  const content = String(children).replace(/\n$/, '');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'my-3 overflow-hidden rounded-lg border',
        isUser ? 'border-white/10 bg-black/20' : 'border-zinc-700 bg-[#1e1e1e]', // Dark theme for code blocks
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-3 py-1.5 text-xs select-none',
          isUser ? 'bg-white/10 text-white/70' : 'bg-[#2d2d2d] text-zinc-400',
        )}
      >
        <span className="font-mono font-medium lowercase">{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 transition-colors hover:text-white"
          title="Copy code"
        >
          {isCopied ? (
            <>
              <Icon icon="solar:check-read-linear" className="size-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Icon icon="solar:copy-linear" className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-sm leading-relaxed text-zinc-100">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}
