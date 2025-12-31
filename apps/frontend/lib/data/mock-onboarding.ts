import { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { generateUUID } from '../utils/utils';
/**
 * SCENARIO 1: THE "WALL OF TEXT"
 * GUARANTEE: Tests if the AI can extract professional bullets and metrics from messy, unstructured input.
 * WHAT IT TESTS: Summarization, Action Verbs, and Extraction of specific dates and technologies.
 */
export const mockWallOfText = (): OnboardingFormInput => ({
  contact: {
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@tech.com',
    phone: '555-0987',
    location: 'Austin, TX',
    githubUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
  },
  summary: '',
  experiences: [
    {
      id: generateUUID(),
      title: 'Full Stack Engineer',
      company: 'DataFlow Inc',
      startMonth: '06',
      startYear: '2021',
      // Messy text with no bullets or structure
      description:
        'I was basically doing everything here. We used React for the frontend but I also had to fix the SQL database and write some Python scripts for the data pipeline. I improved the load time by 40% which was cool because we had a lot of users complain about it before. I worked in a team of 5 and we did agile stuff. I also helped the design team with Figma sometimes.',
      isCurrent: true,
    },
  ],
  projects: [
    {
      id: generateUUID(),
      name: 'Personal Portfolio',
      description:
        'A responsive portfolio website to showcase my coding projects.',
      tech: 'React, Tailwind CSS',
      url: 'https://sarahchen.dev',
      repoUrl: '',
      startMonth: '01',
      startYear: '2023',
      endMonth: '03',
      endYear: '2023',
      isCurrent: false,
    },
  ],
  skills: ['TypeScript', 'React', 'Python', 'SQL', 'Figma', 'Agile'],
  education: {
    school: 'Austin State',
    degree: 'Computer Science',
    startMonth: '09',
    startYear: '2017',
    endMonth: '05',
    endYear: '2021',
    isSelfTaught: false,
  },
});

/**
 * SCENARIO 2: THE "ACTIVE FREELANCER"
 * GUARANTEE: Tests if the AI correctly handles multiple ongoing roles and projects without formatting errors.
 * WHAT IT TESTS: 'isCurrent' logic, 'endDate: null' formatting, and concurrent timeline management.
 */
export const mockActiveFreelancer = (): OnboardingFormInput => ({
  contact: {
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'alex@freelance.io',
    phone: '',
    location: 'Remote',
    githubUrl: 'https://github.com/alexrivera',
    linkedinUrl: '',
    websiteUrl: '',
  },
  summary:
    'Active freelance developer working on multiple simultaneous client projects.',
  experiences: [
    {
      id: generateUUID(),
      title: 'Frontend Consultant',
      company: 'Self-Employed',
      startMonth: '01',
      startYear: '2024',
      description:
        'Consulting for various startups on Next.js and Tailwind architecture.',
      isCurrent: true,
    },
  ],
  projects: [
    {
      id: generateUUID(),
      name: 'OpenSource Dashboard',
      description:
        'Currently building an open-source analytics dashboard for climate researchers.',
      tech: 'Next.js, D3.js, Supabase',
      url: 'https://climate-dash.io',
      repoUrl: 'https://github.com/alex/climate-dash',
      startMonth: '08',
      startYear: '2023',
      isCurrent: true,
    },
    {
      id: generateUUID(),
      name: 'E-commerce API',
      description:
        'Ongoing maintenance and feature development for a high-traffic retail API.',
      tech: 'Node.js, Redis, MongoDB',
      url: '',
      repoUrl: '',
      startMonth: '11',
      startYear: '2023',
      isCurrent: true,
    },
  ],
  skills: ['Next.js', 'Tailwind', 'D3.js', 'Redis', 'Node.js'],
  education: {
    school: '',
    degree: '',
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    isSelfTaught: true,
  },
});

/**
 * SCENARIO 3: THE "GENERALIST"
 * GUARANTEE: Tests the AI's ability to categorize widely varied skills into professional groups.
 * WHAT IT TESTS: Skill categorization (Frontend vs. Backend vs. Design vs. Soft Skills).
 */
export const mockGeneralist = (): OnboardingFormInput => ({
  contact: {
    firstName: 'Jordan',
    lastName: 'Smith',
    email: 'jordan@general.dev',
    phone: '',
    location: 'New York, NY',
    githubUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
  },
  summary:
    'Jack of all trades with a background in design, dev, and management.',
  experiences: [],
  projects: [
    {
      id: generateUUID(),
      name: 'Community Garden App',
      description:
        'A platform for local residents to share tools and coordinate garden maintenance.',
      tech: 'React, Node.js, PostgreSQL',
      url: '',
      repoUrl: 'https://github.com/jordan/garden-app',
      startMonth: '03',
      startYear: '2022',
      endMonth: '06',
      endYear: '2022',
      isCurrent: false,
    },
  ],
  // Highly varied skills to test categorization
  skills: [
    'React',
    'Node.js',
    'Figma',
    'UI/UX Design',
    'Project Management',
    'Agile',
    'Docker',
    'AWS',
    'Public Speaking',
    'Mentoring',
    'Go',
    'PostgreSQL',
    'Adobe Illustrator',
    'CRM Management',
  ],
  education: {
    school: 'NYU',
    degree: 'BA in Liberal Arts',
    startMonth: '09',
    startYear: '2012',
    endMonth: '05',
    endYear: '2016',
    isSelfTaught: false,
  },
});

/**
 * SCENARIO 4: THE "SPARSE PROFILE"
 * GUARANTEE: Tests if the AI can fill in the gaps (like auto-generating a summary) without making up fake facts.
 * WHAT IT TESTS: Summary auto-generation, fallback logic, and handling of empty fields.
 */
export const mockSparseProfile = (): OnboardingFormInput => ({
  contact: {
    firstName: 'Taylor',
    lastName: 'Reed',
    email: 'taylor@minimal.co',
    phone: '',
    location: 'Chicago, IL',
    githubUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
  },
  summary: '', // AI should generate this from the experience
  experiences: [
    {
      id: generateUUID(),
      title: 'Junior Web Developer',
      company: 'Local Shop',
      startMonth: '06',
      startYear: '2023',
      description:
        'I build websites for local businesses using HTML, CSS, and some JavaScript.',
      isCurrent: true,
    },
  ],
  projects: [
    {
      id: generateUUID(),
      name: 'Simple Weather App',
      description:
        'A basic weather application that fetches data from a public API.',
      tech: 'HTML, CSS, JavaScript',
      url: '',
      repoUrl: '',
      startMonth: '10',
      startYear: '2023',
      endMonth: '12',
      endYear: '2023',
      isCurrent: false,
    },
  ],
  skills: ['HTML', 'CSS', 'JavaScript'],
  education: {
    school: 'High School',
    degree: 'Diploma',
    startMonth: '09',
    startYear: '2019',
    endMonth: '05',
    endYear: '2023',
    isSelfTaught: false,
  },
});

/**
 * SCENARIO 5: THE "VETERAN"
 * GUARANTEE: Tests UI performance and data handling for high-volume profiles.
 * WHAT IT TESTS: List rendering performance, long text fields, and AI's ability
 * to parse a large total payload without cutting off data.
 */
export const mockVeteran = (): OnboardingFormInput => ({
  contact: {
    firstName: 'Maximillian-Bartholomew',
    lastName: 'de la Sierra-Ventura',
    email: 'maximillian.bartholomew.delasierra@longdomain.com',
    phone: '+49 123 456 789 012',
    location: 'Sankt-Peter-Ording, Schleswig-Holstein, Germany',
    githubUrl: 'https://github.com/maximillian-bartholomew-de-la-sierra',
    linkedinUrl: 'https://linkedin.com/in/maximillian-bartholomew-de-la-sierra',
    websiteUrl: 'https://blog.maximillian-bartholomew-de-la-sierra.me',
  },
  summary: '',
  experiences: Array.from({ length: 5 }).map((_, i) => ({
    id: generateUUID(),
    title: `Principal Software Systems Architect & Engineering Lead ${i + 1}`,
    company: `Global Enterprise Solutions & Logistics Infrastructure Corp ${i + 1}`,
    startMonth: '01',
    startYear: (2010 + i).toString(),
    endYear: (2012 + i).toString(),
    endMonth: '01',
    description:
      'Spearheaded the complete digital transformation of legacy infrastructure using distributed cloud-native microservices architecture. Managed multiple cross-functional teams of 20+ engineers across 3 continents. Implemented zero-downtime CI/CD pipelines and increased overall system reliability by 99.99%. Negotiated vendor contracts and collaborated with C-level stakeholders to define technology roadmap.',
    isCurrent: i === 4,
  })),
  projects: Array.from({ length: 3 }).map((_, i) => ({
    id: generateUUID(),
    name: `Autonomous Supply Chain Optimization Platform ${i + 1}`,
    description:
      'Designed and implemented an AI-driven autonomous supply chain management system that reduced operational costs by $2M annually. Developed custom neural network models for predictive maintenance and demand forecasting. Integrated with multiple third-party SAP/ERP systems and AWS cloud services.',
    tech: 'Kotlin, Spring Boot, TensorFlow, Kubernetes, AWS, Kafka, Redis, PostgreSQL',
    url: '',
    repoUrl: '',
    startMonth: '06',
    startYear: (2020 + i).toString(),
    endMonth: '08',
    endYear: (2020 + i).toString(),
    isCurrent: false,
  })),
  skills: [
    'System Architecture',
    'Cloud Infrastructure',
    'Microservices',
    'Kubernetes',
    'AWS Cloud Practitioner',
    'TensorFlow',
    'Apache Kafka',
    'Distributed Systems',
    'Agile Leadership',
    'Stakeholder Management',
    'Cost Optimization',
    'CI/CD Pipelines',
  ],
  education: {
    school: 'Massachusetts Institute of Technology (MIT)',
    degree: 'Doctorate in Distributed Information Systems',
    startMonth: '09',
    startYear: '2005',
    endMonth: '05',
    endYear: '2010',
    isSelfTaught: false,
  },
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

  // Increment and wrap around using modulo
  scenarioIndex = (scenarioIndex + 1) % scenarios.length;

  return selectedScenario();
};
