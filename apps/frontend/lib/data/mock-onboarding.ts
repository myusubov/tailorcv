import { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { generateUUID } from '../utils/utils';
import type { BaseResumeData } from 'shared';
/**
 * FORM INITIAL VALUES
 * Used to populate the manual entry form during development.
 */
export const fillValues = (): OnboardingFormInput => ({
  contact: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    githubUrl: 'https://github.com/johndoe',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    websiteUrl: 'https://johndoe.dev',
  },
  summary:
    'Highly motivated frontend developer with experience in React and TypeScript.',
  experiences: [
    {
      id: generateUUID(),
      title: 'Senior Frontend Developer',
      company: 'SoftSync',
      startMonth: '03',
      startYear: '2022',
      description: 'Working on core product features using React.',
      isCurrent: true,
    },
    {
      id: generateUUID(),
      title: 'Frontend Developer',
      company: 'TechFlow',
      startMonth: '01',
      startYear: '2020',
      endMonth: '02',
      endYear: '2022',
      description: 'Built responsive UIs for SaaS applications.',
      isCurrent: false,
    },
  ],
  projects: [
    {
      id: generateUUID(),
      name: 'TailorCV',
      description: 'AI pipeline for automatic resume tailoring.',
      tech: 'Next.js, OpenAI, PostgreSQL',
      url: 'https://tailorcv.app',
      repoUrl: 'https://github.com/johndoe/tailorcv',
      startMonth: '05',
      startYear: '2023',
      isCurrent: true,
    },
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'Next.js'],
  education: {
    school: 'University of Technology',
    degree: 'BS in Computer Science',
    startMonth: '09',
    startYear: '2016',
    endMonth: '05',
    endYear: '2020',
    isSelfTaught: false,
  },
});
