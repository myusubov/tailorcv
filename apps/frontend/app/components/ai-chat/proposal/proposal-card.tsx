import type { BaseResumeData } from 'shared';
import { ProposalHeader, ProposalFooter } from './proposal-ui';
import { ProposalContent } from './proposal-content';

interface ProposalCardProps {
  proposal: Partial<BaseResumeData>;
  originalData?: BaseResumeData;
  explanation: string;
  onApply: () => void;
  onDiscard: () => void;
  canApply?: boolean;
}

export function ProposalCard({
  proposal,
  originalData,
  explanation,
  onApply,
  onDiscard,
  canApply = true,
}: ProposalCardProps) {
  return (
    <div className="bg-content2/50 my-3 w-full max-w-[95%] overflow-hidden rounded-xl border border-default-200 border-l-4 border-l-primary shadow-sm">
      <ProposalHeader explanation={explanation} />

      <div className="mx-3 my-2 h-px bg-default-200" />

      <div className="max-h-75 overflow-y-auto px-4 py-1">
        <ProposalContent proposal={proposal} originalData={originalData} />
      </div>

      <div className="mx-3 my-2 h-px bg-default-200" />

      <ProposalFooter
        canApply={canApply}
        onApply={onApply}
        onDiscard={onDiscard}
      />
    </div>
  );
}


