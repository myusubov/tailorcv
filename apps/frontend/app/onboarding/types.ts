import { IconifyIcon } from '@iconify/react';

export type ManualEntryStep =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education';

export interface ManualStepConfig {
  key: ManualEntryStep;
  icon: string | IconifyIcon;
  label: string;
}

export const MANUAL_STEPS: ManualStepConfig[] = [
  {
    key: 'contact',
    icon: 'lucide:user',
    label: 'Contact',
  },
  {
    key: 'summary',
    icon: 'lucide:file-text',
    label: 'Summary',
  },
  {
    key: 'experience',
    icon: 'lucide:briefcase',
    label: 'Experience',
  },
  {
    key: 'projects',
    icon: 'lucide:rocket',
    label: 'Projects',
  },
  {
    key: 'education',
    icon: 'lucide:graduation-cap',
    label: 'Education',
  },
];
