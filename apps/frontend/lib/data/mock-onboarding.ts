import type { GenerateOnboardingOutput } from '@/lib/types/onboarding';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';

export const MOCK_GENERATED_RESUME: GenerateOnboardingOutput = {
  baseResumeId: 'e21571c1-6b0b-43c9-888c-1f438bb4b5d3',
  data: {
    version: 1,
    contact: {
      firstName: 'Murat',
      lastName: 'Yusubov',
      headline: 'Full Stack Engineer',
      email: 'muradyusubovdev@icloud.com',
      phone: '+90 534 273 44 19',
      location: 'Giresun, Turkey',
      websiteUrl: 'https://muradyusubov.dev',
      linkedinUrl: 'https://linkedin.com/in/murad-yusubov',
      githubUrl: 'https://github.com/biolater',
    },
    summary:
      'Driven Full Stack Engineer specializing in building complex, data-heavy web applications. Proven track record in developing AI-powered CRM systems and creator economy platforms using Next.js and React. Passionate about writing clean code, solving complex architectural problems, and delivering high-performance, user-centric solutions.',
    skills: [
      {
        id: '7b2e8a1c-4d5e-4f6a-8b9c-0d1e2f3a4b5c',
        name: 'JavaScript',
        category: 'Languages',
        level: 'ADVANCED',
      },
      {
        id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        name: 'TypeScript',
        category: 'Languages',
        level: 'ADVANCED',
      },
      {
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        name: 'React',
        category: 'Frontend',
        level: 'ADVANCED',
      },
      {
        id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
        name: 'Next.js',
        category: 'Frontend',
        level: 'ADVANCED',
      },
      {
        id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
        name: 'Tailwind CSS',
        category: 'Frontend',
        level: 'ADVANCED',
      },
      {
        id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
        name: 'Remix',
        category: 'Frontend',
        level: 'INTERMEDIATE',
      },
      {
        id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
        name: 'Node.js',
        category: 'Backend',
        level: 'ADVANCED',
      },
      {
        id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
        name: 'PostgreSQL',
        category: 'Backend',
        level: 'ADVANCED',
      },
      {
        id: 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
        name: 'GraphQL',
        category: 'Backend',
        level: 'INTERMEDIATE',
      },
      {
        id: 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
        name: 'Prisma',
        category: 'Backend',
        level: 'ADVANCED',
      },
      {
        id: 'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
        name: 'Redis',
        category: 'Backend',
        level: 'INTERMEDIATE',
      },
      {
        id: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
        name: 'Supabase',
        category: 'Backend',
        level: 'ADVANCED',
      },
      {
        id: 'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c',
        name: 'Docker',
        category: 'DevOps & Cloud',
        level: 'INTERMEDIATE',
      },
      {
        id: 'a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d',
        name: 'AWS',
        category: 'DevOps & Cloud',
        level: 'INTERMEDIATE',
      },
    ],
    experience: [
      {
        id: '9f8e7d6c-5b4a-4321-8901-abcdef123456',
        company: 'SoftSync',
        title: 'Lead Frontend Developer',
        location: 'Remote',
        startDate: '2024-05',
        endDate: null,
        isCurrent: true,
        tech: ['Next.js', 'GraphQL', 'Shadcn UI', 'TypeScript'],
        bullets: [
          {
            id: 'b1',
            text: 'Architected and developed 90% of the initial UI for an AI-powered CRM, featuring advanced table views with keyboard navigation and drag-and-drop pipelines.',
          },
          {
            id: 'b2',
            text: 'Managed a frontend team of 3 developers, establishing best practices for Next.js and GraphQL integration to ensure scalable application growth.',
          },
          {
            id: 'b3',
            text: 'Engineered complex features including automated email syncing, workspace analysis, and dynamic filtering systems to enhance user productivity.',
          },
          {
            id: 'b4',
            text: 'Implemented agentic AI capabilities within the CRM interface, enabling seamless interaction between users and automated AI workflows.',
          },
        ],
      },
      {
        id: '8e7d6c5b-4a32-4109-9012-bcdef1234567',
        company: 'Ascnd',
        title: 'Frontend Developer',
        location: 'Remote',
        startDate: '2025-02',
        endDate: '2025-05',
        isCurrent: false,
        tech: ['Remix', 'React Router', 'Stripe', 'Tailwind CSS'],
        bullets: [
          {
            id: 'b5',
            text: 'Developed a creator-focused content platform using Remix, facilitating subscription tier management and secure pay-per-view video locking.',
          },
          {
            id: 'b6',
            text: 'Collaborated in a high-velocity team to deliver a responsive content delivery system integrated with Stripe for global payment processing.',
          },
          {
            id: 'b7',
            text: 'Optimized user account workflows and onboarding sequences, resulting in a streamlined experience for both creators and subscribers.',
          },
        ],
      },
    ],
    projects: [
      {
        id: '7d6c5b4a-3210-4901-a012-cdef12345678',
        name: 'Scope Matter',
        role: 'Full Stack Developer',
        startDate: '2024-01',
        endDate: null,
        url: 'https://scopematter.xyz',
        repoUrl: 'https://github.com/biolater/scopematter',
        tech: [
          'Next.js 15',
          'TypeScript',
          'Supabase',
          'PostgreSQL',
          'Redis',
          'Clerk',
        ],
        bullets: [
          {
            id: 'b8',
            text: 'Engineered a scope creep prevention tool for freelancers, featuring a comprehensive dashboard for real-time project health tracking.',
          },
          {
            id: 'b9',
            text: 'Developed automated change order generation and request management systems to formalize project requirements and protect revenue.',
          },
          {
            id: 'b10',
            text: 'Leveraged Next.js 15 and Redis to ensure high-performance data handling and a seamless user experience for complex project workflows.',
          },
        ],
      },
      {
        id: '6c5b4a32-1098-4123-b012-def123456789',
        name: 'Student Budget Buddy',
        role: 'Full Stack Developer',
        startDate: '2023-08',
        endDate: null,
        url: 'https://student-bugdet-buddy-lyje.vercel.app',
        repoUrl: 'https://github.com/biolater/student-budget-buddy',
        tech: [
          'Next.js',
          'PostgreSQL',
          'Prisma',
          'Tailwind CSS',
          'Clerk',
          'ChatGPT API',
        ],
        bullets: [
          {
            id: 'b11',
            text: 'Created a multi-currency financial tracking application featuring interactive data visualizations with Charts.js for student expense management.',
          },
          {
            id: 'b12',
            text: 'Integrated ChatGPT API to provide personalized, AI-powered financial insights and budgeting recommendations based on user spending habits.',
          },
          {
            id: 'b13',
            text: 'Implemented robust recurring transaction management and secure authentication using Clerk and Prisma ORM.',
          },
        ],
      },
    ],
    education: [
      {
        id: '5b4a3210-9876-4234-c012-ef1234567890',
        school: 'Giresun University',
        degree: 'Bachelor of Economics',
        field: 'Economics',
        location: 'Giresun, Turkey',
        startDate: '2022-09',
        endDate: '2026-06',
        grade: null,
        notes: 'In Progress',
      },
    ],
  },
  meta: {
    model: 'gemini-3-flash-preview',
    finishReason: 'STOP',
  },
};

export const MOCK_ONBOARDING_FORM_VALUES: OnboardingFormInput = {
  contact: {
    fullName: 'Murat Yusubov',
    email: 'muradyusubovdev@icloud.com',
    phone: '+90 534 273 44 19',
    location: 'Giresun, Turkey',
    github: 'github.com/Biolater',
    linkedin: 'linkedin.com/in/murad-yusubov',
    portfolio: 'muradyusubov.dev',
  },
  summary:
    'Driven Full Stack Engineer (contractor) specializing in building complex, data-heavy web applications. Proven track record in developing AI-powered CRM systems and creator economy platforms using Next.js and React. Passionate about writing clean code, solving complex architectural problems, and delivering high-performance, user-centric solutions.',
  experiences: [
    {
      id: 'softsync-id',
      jobTitle: 'Lead Frontend Developer',
      company: 'SoftSync',
      startMonth: '05',
      startYear: '2024',
      endMonth: '',
      endYear: '',
      isCurrent: true,
      description:
        'Lead frontend development of a complex AI-powered CRM with agentic capabilities. Built 90% of the initial UI, including advanced table views with keyboard navigation, drag-and-drop pipelines, and dynamic filtering. Managed a frontend team of 3 developers, implementing Next.js, GraphQL, and Shadcn UI. Integrated key features like email syncing, automatic merging, and AI-driven workspace analysis.',
    },
    {
      id: 'ascnd-id',
      jobTitle: 'Frontend Developer',
      company: 'Ascnd',
      startMonth: '02',
      startYear: '2025',
      endMonth: '05',
      endYear: '2025',
      isCurrent: false,
      description:
        'Developed the frontend for a creator-focused content platform (Patreon clone) using Remix and React Router. Implemented core features including subscription tier management, pay-per-view video locking, and user account workflows. Collaborated in a small team to deliver a responsive, scalable content delivery system integrated with Stripe.',
    },
  ],
  projects: [
    {
      id: 'scopematter-id',
      name: 'Scope Matter',
      description:
        'A scope creep prevention tool for freelancers to formalize project requirements. Features a comprehensive dashboard for tracking project health, request management, and automated change order generation.',
      techStack: 'Next.js 15, TypeScript, Supabase, PostgreSQL, Redis, Clerk',
      link: 'https://scopematter.xyz',
      repoUrl: 'github.com/Biolater/scopematter',
    },
    {
      id: 'budget-buddy-id',
      name: 'Student Budget Buddy',
      description:
        'A multi-currency financial tracking application featuring data visualization with Charts.js, recurring transaction management, and AI-powered financial insights using ChatGPT API.',
      techStack: 'Next.js, PostgreSQL, Prisma, Tailwind CSS, Clerk',
      link: 'https://student-bugdet-buddy-lyje.vercel.app',
      repoUrl: 'github.com/Biolater/Student-Budget-Buddy',
    },
  ],
  skills: [
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'PostgreSQL',
    'Tailwind CSS',
    'GraphQL',
    'Remix',
    'Prisma',
    'Docker',
    'AWS',
    'Redis',
    'Supabase',
  ],
  education: {
    degree: 'Bachelor of Economics (In Progress)',
    school: 'Giresun University',
    graduationYear: '2026',
    isSelfTaught: false,
  },
};
