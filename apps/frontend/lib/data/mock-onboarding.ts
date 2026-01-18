import { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { nanoid } from 'nanoid';

/**
 * SCENARIO 1: THE "WALL OF TEXT"
 * Tests if the AI can extract professional bullets and metrics from messy, unstructured input.
 */
export const mockWallOfText = (): OnboardingFormInput => ({
  version: 1,
  contact: {
    firstName: 'Sarah',
    lastName: 'Chen',
    headline: null,
    email: 'sarah.chen@tech.com',
    phone: '555-0987',
    location: 'Austin, TX',
    githubUrl: null,
    linkedinUrl: null,
    websiteUrl: null,
  },
  summary: null,
  experiences: [
    {
      id: nanoid(),
      title: 'Full Stack Engineer',
      company: 'DataFlow Inc',
      location: null,
      startDate: '2021-06',
      endDate: null,
      isCurrent: true,
      tech: ['React', 'SQL', 'Python'],
      bullets: [
        {
          id: nanoid(),
          text: 'I was basically doing everything here. We used React for the frontend but I also had to fix the SQL database and write some Python scripts for the data pipeline. I improved the load time by 40% which was cool because we had a lot of users complain about it before.',
        },
      ],
    },
  ],
  projects: [
    {
      id: nanoid(),
      name: 'Personal Portfolio',
      role: null,
      startDate: '2023-01',
      endDate: '2023-03',
      isCurrent: false,
      url: 'https://sarahchen.dev',
      repoUrl: null,
      tech: ['React', 'Tailwind CSS'],
      bullets: [
        {
          id: nanoid(),
          text: 'A responsive portfolio website to showcase my coding projects.',
        },
      ],
    },
  ],
  skills: [
    { id: nanoid(), name: 'TypeScript', category: null, level: null },
    { id: nanoid(), name: 'React', category: null, level: null },
    { id: nanoid(), name: 'Python', category: null, level: null },
    { id: nanoid(), name: 'SQL', category: null, level: null },
    { id: nanoid(), name: 'Figma', category: null, level: null },
    { id: nanoid(), name: 'Agile', category: null, level: null },
  ],
  education: [
    {
      id: nanoid(),
      school: 'Austin State',
      degree: 'Computer Science',
      field: null,
      location: null,
      startDate: '2017-09',
      endDate: '2021-05',
      grade: null,
      notes: null,
      isCurrent: null,
    },
  ],
  certifications: null,
  languages: null,
});

/**
 * SCENARIO 2: THE "ACTIVE FREELANCER"
 * Tests if the AI correctly handles multiple ongoing roles and projects.
 */
export const mockActiveFreelancer = (): OnboardingFormInput => ({
  version: 1,
  contact: {
    firstName: 'Alex',
    lastName: 'Rivera',
    headline: null,
    email: 'alex@freelance.io',
    phone: null,
    location: 'Remote',
    githubUrl: 'https://github.com/alexrivera',
    linkedinUrl: null,
    websiteUrl: null,
  },
  summary:
    'Active freelance developer working on multiple simultaneous client projects.',
  experiences: [
    {
      id: nanoid(),
      title: 'Frontend Consultant',
      company: 'Self-Employed',
      location: null,
      startDate: '2024-01',
      endDate: null,
      isCurrent: true,
      tech: ['Next.js', 'Tailwind'],
      bullets: [
        {
          id: nanoid(),
          text: 'Consulting for various startups on Next.js and Tailwind architecture.',
        },
      ],
    },
  ],
  projects: [
    {
      id: nanoid(),
      name: 'OpenSource Dashboard',
      role: null,
      startDate: '2023-08',
      endDate: null,
      isCurrent: true,
      url: 'https://climate-dash.io',
      repoUrl: 'https://github.com/alex/climate-dash',
      tech: ['Next.js', 'D3.js', 'Supabase'],
      bullets: [
        {
          id: nanoid(),
          text: 'Currently building an open-source analytics dashboard for climate researchers.',
        },
      ],
    },
    {
      id: nanoid(),
      name: 'E-commerce API',
      role: null,
      startDate: '2023-11',
      endDate: null,
      isCurrent: true,
      url: null,
      repoUrl: null,
      tech: ['Node.js', 'Redis', 'MongoDB'],
      bullets: [
        {
          id: nanoid(),
          text: 'Ongoing maintenance and feature development for a high-traffic retail API.',
        },
      ],
    },
  ],
  skills: [
    { id: nanoid(), name: 'Next.js', category: null, level: null },
    { id: nanoid(), name: 'Tailwind', category: null, level: null },
    { id: nanoid(), name: 'D3.js', category: null, level: null },
    { id: nanoid(), name: 'Redis', category: null, level: null },
    { id: nanoid(), name: 'Node.js', category: null, level: null },
  ],
  education: null,
  certifications: null,
  languages: null,
});

/**
 * SCENARIO 3: THE "GENERALIST"
 * Tests the AI's ability to categorize widely varied skills.
 */
export const mockGeneralist = (): OnboardingFormInput => ({
  version: 1,
  contact: {
    firstName: 'Jordan',
    lastName: 'Smith',
    headline: null,
    email: 'jordan@general.dev',
    phone: null,
    location: 'New York, NY',
    githubUrl: null,
    linkedinUrl: null,
    websiteUrl: null,
  },
  summary:
    'Jack of all trades with a background in design, dev, and management.',
  experiences: [],
  projects: [
    {
      id: nanoid(),
      name: 'Community Garden App',
      role: null,
      startDate: '2022-03',
      endDate: '2022-06',
      isCurrent: false,
      url: null,
      repoUrl: 'https://github.com/jordan/garden-app',
      tech: ['React', 'Node.js', 'PostgreSQL'],
      bullets: [
        {
          id: nanoid(),
          text: 'A platform for local residents to share tools and coordinate garden maintenance.',
        },
      ],
    },
  ],
  skills: [
    { id: nanoid(), name: 'React', category: null, level: null },
    { id: nanoid(), name: 'Node.js', category: null, level: null },
    { id: nanoid(), name: 'Figma', category: null, level: null },
    { id: nanoid(), name: 'UI/UX Design', category: null, level: null },
    { id: nanoid(), name: 'Project Management', category: null, level: null },
    { id: nanoid(), name: 'Docker', category: null, level: null },
    { id: nanoid(), name: 'AWS', category: null, level: null },
    { id: nanoid(), name: 'PostgreSQL', category: null, level: null },
  ],
  education: [
    {
      id: nanoid(),
      school: 'NYU',
      degree: 'BA in Liberal Arts',
      field: null,
      location: null,
      startDate: '2012-09',
      endDate: '2016-05',
      grade: null,
      notes: null,
      isCurrent: null,
    },
  ],
  certifications: null,
  languages: null,
});

/**
 * SCENARIO 4: THE "SPARSE PROFILE"
 * Tests if the AI can fill in gaps without making up fake facts.
 */
export const mockSparseProfile = (): OnboardingFormInput => ({
  version: 1,
  contact: {
    firstName: 'Taylor',
    lastName: 'Reed',
    headline: null,
    email: 'taylor@minimal.co',
    phone: null,
    location: 'Chicago, IL',
    githubUrl: null,
    linkedinUrl: null,
    websiteUrl: null,
  },
  summary: null,
  experiences: [
    {
      id: nanoid(),
      title: 'Junior Web Developer',
      company: 'Local Shop',
      location: null,
      startDate: '2023-06',
      endDate: null,
      isCurrent: true,
      tech: ['HTML', 'CSS', 'JavaScript'],
      bullets: [
        {
          id: nanoid(),
          text: 'I build websites for local businesses using HTML, CSS, and some JavaScript.',
        },
      ],
    },
  ],
  projects: [
    {
      id: nanoid(),
      name: 'Simple Weather App',
      role: null,
      startDate: '2023-10',
      endDate: '2023-12',
      isCurrent: false,
      url: null,
      repoUrl: null,
      tech: ['HTML', 'CSS', 'JavaScript'],
      bullets: [
        {
          id: nanoid(),
          text: 'A basic weather application that fetches data from a public API.',
        },
      ],
    },
  ],
  skills: [
    { id: nanoid(), name: 'HTML', category: null, level: null },
    { id: nanoid(), name: 'CSS', category: null, level: null },
    { id: nanoid(), name: 'JavaScript', category: null, level: null },
  ],
  education: [
    {
      id: nanoid(),
      school: 'High School',
      degree: 'Diploma',
      field: null,
      location: null,
      startDate: '2019-09',
      endDate: '2023-05',
      grade: null,
      notes: null,
      isCurrent: null,
    },
  ],
  certifications: null,
  languages: null,
});

/**
 * SCENARIO 5: THE "VETERAN"
 * Tests UI performance and data handling for high-volume profiles.
 */
export const mockVeteran = (): OnboardingFormInput => ({
  version: 1,
  contact: {
    firstName: 'Maximillian-Bartholomew',
    lastName: 'de la Sierra-Ventura',
    headline: null,
    email: 'maximillian.bartholomew.delasierra@longdomain.com',
    phone: '+49 123 456 789 012',
    location: 'Sankt-Peter-Ording, Schleswig-Holstein, Germany',
    githubUrl: 'https://github.com/maximillian-bartholomew-de-la-sierra',
    linkedinUrl: 'https://linkedin.com/in/maximillian-bartholomew-de-la-sierra',
    websiteUrl: 'https://blog.maximillian-bartholomew-de-la-sierra.me',
  },
  summary: null,
  experiences: Array.from({ length: 5 }).map((_, i) => ({
    id: nanoid(),
    title: `Principal Software Systems Architect & Engineering Lead ${i + 1}`,
    company: `Global Enterprise Solutions Corp ${i + 1}`,
    location: null,
    startDate: `${2010 + i}-01`,
    endDate: i === 4 ? null : `${2012 + i}-01`,
    isCurrent: i === 4,
    tech: ['Kotlin', 'Spring Boot', 'Kubernetes', 'AWS'],
    bullets: [
      {
        id: nanoid(),
        text: 'Spearheaded the complete digital transformation of legacy infrastructure using distributed cloud-native microservices architecture. Managed multiple cross-functional teams of 20+ engineers across 3 continents.',
      },
    ],
  })),
  projects: Array.from({ length: 3 }).map((_, i) => ({
    id: nanoid(),
    name: `Autonomous Supply Chain Platform ${i + 1}`,
    role: null,
    startDate: `${2020 + i}-06`,
    endDate: `${2020 + i}-08`,
    isCurrent: false,
    url: null,
    repoUrl: null,
    tech: ['Kotlin', 'Spring Boot', 'TensorFlow', 'Kubernetes', 'AWS'],
    bullets: [
      {
        id: nanoid(),
        text: 'Designed and implemented an AI-driven autonomous supply chain management system that reduced operational costs by $2M annually.',
      },
    ],
  })),
  skills: [
    { id: nanoid(), name: 'System Architecture', category: null, level: null },
    { id: nanoid(), name: 'Cloud Infrastructure', category: null, level: null },
    { id: nanoid(), name: 'Microservices', category: null, level: null },
    { id: nanoid(), name: 'Kubernetes', category: null, level: null },
    { id: nanoid(), name: 'AWS', category: null, level: null },
    { id: nanoid(), name: 'TensorFlow', category: null, level: null },
    { id: nanoid(), name: 'Distributed Systems', category: null, level: null },
    { id: nanoid(), name: 'CI/CD Pipelines', category: null, level: null },
  ],
  education: [
    {
      id: nanoid(),
      school: 'Massachusetts Institute of Technology (MIT)',
      degree: 'Doctorate in Distributed Information Systems',
      field: null,
      location: null,
      startDate: '2005-09',
      endDate: '2010-05',
      grade: null,
      notes: null,
      isCurrent: null,
    },
  ],
  certifications: null,
  languages: null,
});

/**
 * MAIN FILL VALUES
 * Cycles through each scenario sequentially every time it is called.
 */
const scenarios = [
  mockWallOfText,
  mockActiveFreelancer,
  mockGeneralist,
  mockSparseProfile,
  mockVeteran,
];

let scenarioIndex = 0;

export const fillValues = (): OnboardingFormInput => {
  const selectedScenario = scenarios[scenarioIndex];
  scenarioIndex = (scenarioIndex + 1) % scenarios.length;
  return selectedScenario();
};
