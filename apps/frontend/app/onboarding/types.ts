export type OnboardingMethod = 'github' | 'upload' | 'manual' | null;

export type ManualEntryStep =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education';

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  portfolio: string;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string;
  link: string;
}

export interface Education {
  degree: string;
  school: string;
  graduationYear: string;
  isSelfTaught: boolean;
}

export interface OnboardingFormData {
  contact: ContactInfo;
  summary: string;
  experiences: Experience[];
  projects: Project[];
  skills: string[];
  education: Education;
}

export const MANUAL_STEPS: { key: ManualEntryStep; label: string; icon: string }[] = [
  { key: 'contact', label: 'Contact Info', icon: 'lucide:user' },
  { key: 'summary', label: 'Summary', icon: 'lucide:file-text' },
  { key: 'experience', label: 'Experience', icon: 'lucide:briefcase' },
  { key: 'projects', label: 'Projects & Skills', icon: 'lucide:rocket' },
  { key: 'education', label: 'Education', icon: 'lucide:graduation-cap' },
];
