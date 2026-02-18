import type { BaseResumeData } from 'shared';
import {
  SkillsProposal,
  ContactProposal,
  ListProposal,
  TextProposal,
  type ListItem,
} from './proposal-fields';

export function ProposalContent({ 
  proposal, 
  originalData 
}: { 
  proposal: Partial<BaseResumeData>;
  originalData?: BaseResumeData;
}) {
  return (
    <div className="space-y-4">
      {(Object.keys(proposal) as Array<keyof BaseResumeData>).map((key) => {
        const value = proposal[key];
        if (value === undefined || value === null) return null;

        const originalValue = originalData?.[key];

        if (key === 'skills' && Array.isArray(value)) {
          return (
            <SkillsProposal
              key={key}
              skills={value as NonNullable<BaseResumeData['skills']>}
              originalSkills={originalValue as BaseResumeData['skills']}
            />
          );
        }

        if (key === 'contact' && typeof value === 'object') {
          return (
            <ContactProposal
              key={key}
              contact={value as NonNullable<BaseResumeData['contact']>}
              originalContact={originalValue as BaseResumeData['contact']}
            />
          );
        }

        if (
          (key === 'experiences' || key === 'projects' || key === 'education') &&
          Array.isArray(value)
        ) {
          return (
            <ListProposal 
              key={key} 
              label={key} 
              items={value as ListItem[]}
              originalItems={originalValue as ListItem[]}
            />
          );
        }

        if (typeof value === 'string') {
          return (
            <TextProposal 
              key={key} 
              label={key} 
              text={value} 
              originalText={originalValue as string}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
