import { Check, X } from 'lucide-react';
import { Button, Card } from '@heroui/react';
import type { BaseResumeData } from 'shared';

interface ProposalCardProps {
  proposal: Partial<BaseResumeData>;
  explanation: string;
  onApply: () => void;
  onDiscard: () => void;
  canApply?: boolean;
}

export function ProposalCard({
  proposal,
  explanation,
  onApply,
  onDiscard,
  canApply = true,
}: ProposalCardProps) {
  // Helper to format the proposal for display (flattening slightly for readability)
  const formattedProposal = Object.entries(proposal).map(([key, value]) => {
    return {
      field: key.charAt(0).toUpperCase() + key.slice(1),
      value:
        typeof value === 'object'
          ? JSON.stringify(value, null, 2)
          : String(value),
    };
  });

  return (
    <Card className="bg-content2 dark:bg-content1 my-2 w-full max-w-[85%] border-l-4 border-l-indigo-500 p-4">
      <div className="mb-2">
        <p className="text-sm font-semibold text-indigo-500">
          AI Suggested Changes
        </p>
        <p className="text-foreground/80 text-sm">{explanation}</p>
      </div>

      {/* <Divider className="my-2" /> */}

      <div className="bg-default-100 mb-4 max-h-40 overflow-y-auto rounded p-2 font-mono text-xs">
        {formattedProposal.map((item, idx) => (
          <div key={idx} className="mb-1">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {item.field}:
            </span>{' '}
            <span className="whitespace-pre-wrap">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {!canApply && (
          <p className="text-[10px] text-warning-600 dark:text-warning-400">
            Apply these changes in the resume editor.
          </p>
        )}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="primary" 
            onPress={onApply}
            isDisabled={!canApply}
          >
            <Check size={14} />
            Apply Changes
          </Button>
          <Button size="sm" variant="danger-soft" onPress={onDiscard}>
            <X size={14} />
            Discard
          </Button>
        </div>
      </div>
    </Card>
  );
}
