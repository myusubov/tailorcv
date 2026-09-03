import { Check, X, Sparkles } from 'lucide-react';
import { Button } from '@heroui/react';

interface ProposalHeaderProps {
  explanation: string;
}

export function ProposalHeader({ explanation }: ProposalHeaderProps) {
  return (
    <div className="flex gap-3 p-3 pb-2">
      <div className="bg-accent/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Sparkles className="text-accent size-4" />
      </div>
      <div className="flex flex-col">
        <p className="text-small text-foreground font-bold">AI Suggestion</p>
        <p className="text-tiny text-muted leading-tight">{explanation}</p>
      </div>
    </div>
  );
}

interface ProposalFooterProps {
  canApply: boolean;
  onApply: () => void;
  onDiscard: () => void;
}

export function ProposalFooter({
  canApply,
  onApply,
  onDiscard,
}: ProposalFooterProps) {
  return (
    <div className="flex flex-col gap-2 p-3 pt-0">
      {!canApply && (
        <p className="text-warning w-full text-center text-[10px]">
          Apply these changes in the resume editor.
        </p>
      )}
      <div className="flex w-full gap-2">
        <Button
          className="flex-1 gap-2 font-medium"
          variant="primary"
          size="sm"
          onPress={onApply}
          isDisabled={!canApply}
        >
          <Check size={14} />
          Apply
        </Button>
        <Button
          className="flex-1 gap-2 font-medium"
          variant="danger-soft"
          size="sm"
          onPress={onDiscard}
        >
          <X size={14} />
          Discard
        </Button>
      </div>
    </div>
  );
}
