import { Chip } from '@heroui/react';
import type { BaseResumeData } from 'shared';

function Label({ text }: { text: string }) {
  return (
    <p className="text-xs font-semibold text-default-500 uppercase tracking-wider">
      {text.charAt(0).toUpperCase() + text.slice(1)}
    </p>
  );
}

export function SkillsProposal({ 
  skills, 
  originalSkills 
}: { 
  skills: NonNullable<BaseResumeData['skills']>;
  originalSkills?: BaseResumeData['skills'];
}) {
  // Only show added skills for better UX
  const newSkills = skills.filter(
    (s) => !originalSkills?.some((os) => os.name.toLowerCase() === s.name.toLowerCase())
  );

  // If no new skills, but the AI included them (maybe it reordered?), show all but maybe the user won't care
  // However, usually it's used to add.
  const displaySkills = newSkills.length > 0 ? newSkills : skills;

  return (
    <div className="space-y-2">
      <Label text={newSkills.length > 0 ? "New Skills" : "Skills"} />
      <div className="flex flex-wrap gap-2">
        {displaySkills.map((skill, i) => (
          <Chip
            key={i}
            size="sm"
            variant="soft"
            color="accent"
            className="px-1"
          >
            <span className="font-medium">{skill.name}</span>
          </Chip>
        ))}
        {newSkills.length === 0 && skills.length > 0 && (
          <span className="text-tiny text-default-400 italic">No new skills added</span>
        )}
      </div>
    </div>
  );
}

export function ContactProposal({ 
  contact,
  originalContact 
}: { 
  contact: NonNullable<BaseResumeData['contact']>;
  originalContact?: BaseResumeData['contact'];
}) {
  return (
    <div className="space-y-2">
      <Label text="Contact Updates" />
       <div className="grid grid-cols-2 gap-2">
         {Object.entries(contact).map(([subKey, subValue]) => {
            if (!subValue || typeof subValue !== 'string') return null;
            
            const isChanged = originalContact?.[subKey as keyof typeof contact] !== subValue;
            if (!isChanged) return null; // Only show changed contact info

            return (
              <div key={subKey} className="rounded-md bg-accent/5 p-2 border border-accent/10">
                <span className="block text-[10px] text-accent font-bold uppercase">{subKey}</span>
                <span className="block truncate text-xs font-medium text-foreground" title={subValue}>{subValue}</span>
              </div>
            )
         })}
       </div>
    </div>
  )
}

/** Union type for list-based resume sections (experiences, projects, education) */
export type ListItem =
  | NonNullable<BaseResumeData['experiences']>[number]
  | NonNullable<BaseResumeData['projects']>[number]
  | NonNullable<BaseResumeData['education']>[number];

export function ListProposal({ 
  label, 
  items,
  originalItems 
}: { 
  label: string; 
  items: ListItem[];
  originalItems?: ListItem[];
}) {
  // Simple diff: items in 'items' that aren't in 'originalItems' (by title/name/company/school)
  const newItems = items.filter(
    (item) => !originalItems?.some((oi) => {
      // Use type guards or property checks to find a matching key
      const getCompareKey = (it: ListItem) => {
        if ('company' in it) return `${it.company}-${it.title}`;
        if ('school' in it) return `${it.school}-${it.degree}`;
        if ('name' in it) return it.name;
        return '';
      };
      return getCompareKey(oi) === getCompareKey(item);
    })
  );

  const displayItems = newItems.length > 0 ? newItems : items;

  return (
    <div className="space-y-2">
      <Label text={newItems.length > 0 ? `New ${label}` : label} />
      <div className="space-y-2">
        {displayItems.map((item, i) => {
          // Type-safe property access
          const title = 'company' in item ? item.company : ('school' in item ? item.school : ('name' in item ? item.name : 'Item'));
          const subtitle = 'title' in item ? item.title : ('degree' in item ? item.degree : ('role' in item ? item.role : undefined));
          const date = 'startDate' in item ? item.startDate : ('date' in item ? (item as any).date : undefined);
          const endDate = 'endDate' in item ? item.endDate : undefined;

          return (
            <div key={i} className="relative rounded-lg border border-default-200 bg-default-50 p-3 text-sm">
               <div className="font-semibold text-foreground">
                 {title}
                 {newItems.length > 0 && <span className="ml-2 text-[10px] text-primary font-bold uppercase">New</span>}
               </div>
               {subtitle && (
                 <div className="text-xs text-default-500">
                   {subtitle}
                 </div>
               )}
               {date && (
                  <div className="mt-1 text-[10px] text-default-400">
                    {date} {endDate ? ` - ${endDate}` : ''}
                  </div>
               )}
               {'bullets' in item && item.bullets && Array.isArray(item.bullets) && item.bullets.length > 0 && (
                 <ul className="mt-2 list-disc pl-4 text-xs text-default-600 space-y-1">
                   {item.bullets.slice(0, 2).map((b, bi) => (
                     <li key={bi}>{b.text}</li>
                   ))}
                   {item.bullets.length > 2 && <li className="list-none text-[10px] italic">+{item.bullets.length - 2} more...</li>}
                 </ul>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TextProposal({ 
  label, 
  text,
  originalText 
}: { 
  label: string; 
  text: string;
  originalText?: string;
}) {
  if (text === originalText) return null;

  return (
    <div className="space-y-1">
      <Label text={label} />
      <div className="rounded-lg bg-primary/5 p-3 text-sm text-foreground border border-primary/10">
        {text}
      </div>
    </div>
  );
}

