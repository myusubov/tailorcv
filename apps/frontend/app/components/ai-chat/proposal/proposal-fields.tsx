import { Chip } from '@heroui/react';
import type { BaseResumeData } from 'shared';

function Label({ text }: { text: string }) {
  return (
    <p className="text-muted text-xs font-semibold tracking-wider uppercase">
      {text.charAt(0).toUpperCase() + text.slice(1)}
    </p>
  );
}

export function SkillsProposal({
  skills,
  originalSkills,
}: {
  skills: NonNullable<BaseResumeData['skills']>;
  originalSkills?: BaseResumeData['skills'];
}) {
  // Only show added skills for better UX
  const newSkills = skills.filter(
    (s) =>
      !originalSkills?.some(
        (os) => os.name.toLowerCase() === s.name.toLowerCase(),
      ),
  );

  // If no new skills, but the AI included them (maybe it reordered?), show all but maybe the user won't care
  // However, usually it's used to add.
  const displaySkills = newSkills.length > 0 ? newSkills : skills;

  return (
    <div className="space-y-2">
      <Label text={newSkills.length > 0 ? 'New Skills' : 'Skills'} />
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
          <span className="text-tiny text-muted italic">
            No new skills added
          </span>
        )}
      </div>
    </div>
  );
}

export function ContactProposal({
  contact,
  originalContact,
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

          const isChanged =
            originalContact?.[subKey as keyof typeof contact] !== subValue;
          if (!isChanged) return null; // Only show changed contact info

          return (
            <div
              key={subKey}
              className="bg-accent/5 border-accent/10 rounded-md border p-2"
            >
              <span className="text-accent block text-[10px] font-bold uppercase">
                {subKey}
              </span>
              <span
                className="text-foreground block truncate text-xs font-medium"
                title={subValue}
              >
                {subValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Union type for list-based resume sections (experiences, projects, education) */
export type ListItem =
  | NonNullable<BaseResumeData['experiences']>[number]
  | NonNullable<BaseResumeData['projects']>[number]
  | NonNullable<BaseResumeData['education']>[number];

export function ListProposal({
  label,
  items,
  originalItems,
}: {
  label: string;
  items: ListItem[];
  originalItems?: ListItem[];
}) {
  // Simple diff: items in 'items' that aren't in 'originalItems' (by title/name/company/school)
  const newItems = items.filter(
    (item) =>
      !originalItems?.some((oi) => {
        // Use type guards or property checks to find a matching key
        const getCompareKey = (it: ListItem) => {
          if ('company' in it) return `${it.company}-${it.title}`;
          if ('school' in it) return `${it.school}-${it.degree}`;
          if ('name' in it) return it.name;
          return '';
        };
        return getCompareKey(oi) === getCompareKey(item);
      }),
  );

  const displayItems = newItems.length > 0 ? newItems : items;

  return (
    <div className="space-y-2">
      <Label text={newItems.length > 0 ? `New ${label}` : label} />
      <div className="space-y-2">
        {displayItems.map((item, i) => {
          // Type-safe property access
          const title =
            'company' in item
              ? item.company
              : 'school' in item
                ? item.school
                : 'name' in item
                  ? item.name
                  : 'Item';
          const subtitle =
            'title' in item
              ? item.title
              : 'degree' in item
                ? item.degree
                : 'role' in item
                  ? item.role
                  : undefined;
          const date =
            'startDate' in item
              ? item.startDate
              : 'date' in item
                ? (item as any).date
                : undefined;
          const endDate = 'endDate' in item ? item.endDate : undefined;

          return (
            <div
              key={i}
              className="border-border bg-default-soft relative rounded-lg border p-3 text-sm"
            >
              <div className="text-foreground font-semibold">
                {title}
                {newItems.length > 0 && (
                  <span className="text-accent ml-2 text-[10px] font-bold uppercase">
                    New
                  </span>
                )}
              </div>
              {subtitle && <div className="text-muted text-xs">{subtitle}</div>}
              {date && (
                <div className="text-muted mt-1 text-[10px]">
                  {date} {endDate ? ` - ${endDate}` : ''}
                </div>
              )}
              {'bullets' in item &&
                item.bullets &&
                Array.isArray(item.bullets) &&
                item.bullets.length > 0 && (
                  <ul className="text-muted mt-2 list-disc space-y-1 pl-4 text-xs">
                    {item.bullets.slice(0, 2).map((b, bi) => (
                      <li key={bi}>{b.text}</li>
                    ))}
                    {item.bullets.length > 2 && (
                      <li className="list-none text-[10px] italic">
                        +{item.bullets.length - 2} more...
                      </li>
                    )}
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
  originalText,
}: {
  label: string;
  text: string;
  originalText?: string;
}) {
  if (text === originalText) return null;

  return (
    <div className="space-y-1">
      <Label text={label} />
      <div className="bg-accent/5 text-foreground border-accent/10 rounded-lg border p-3 text-sm">
        {text}
      </div>
    </div>
  );
}
