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

export const MOCK_ONBOARDING_FORM_VALUES_V2: OnboardingFormInput = {
  contact: {
    fullName: 'Sarah Chen',
    email: 'sarah.chen@design.co',
    phone: '+1 555 012 3456',
    location: 'San Francisco, CA',
    github: 'github.com/schen-design',
    linkedin: 'linkedin.com/in/sarahchen-design',
    portfolio: 'sarahchen.design',
  },
  summary:
    'Award-winning Senior Product Designer with 6+ years of experience crafting intuitive digital experiences. Specialized in design systems, accessibility, and user research. Passionate about bridging the gap between design and engineering to build scalable products.',
  experiences: [
    {
      id: 'techflow-id',
      jobTitle: 'Senior Product Designer',
      company: 'TechFlow',
      startMonth: '03',
      startYear: '2022',
      endMonth: '',
      endYear: '',
      isCurrent: true,
      description:
        'Leading the design system team for a major enterprise SaaS platform. Reduced design-to-dev handoff time by 40% through a comprehensive component library in Figma. Mentoring 2 junior designers and conducting weekly design critiques.',
    },
    {
      id: 'creative-sol-id',
      jobTitle: 'UX Designer',
      company: 'Creative Solutions',
      startMonth: '06',
      startYear: '2019',
      endMonth: '02',
      endYear: '2022',
      isCurrent: false,
      description:
        'Designed end-to-end mobile app experiences for various fintech clients. Conducted user interviews, created wireframes and high-fidelity prototypes. Collaborated closely with developers to ensure design fidelity in production.',
    },
  ],
  projects: [
    {
      id: 'fintech-ds-id',
      name: 'Fintech Design System',
      description:
        'A comprehensive design system for a banking application, including typography, color palette, and accessible component library.',
      techStack: 'Figma, Storybook, React, CSS Modules',
      link: 'https://design.fintech.com',
      repoUrl: '',
    },
    {
      id: 'a11y-audit-id',
      name: 'Accessibility Audit Tool',
      description:
        'An internal tool to automated accessibility checks for design files, ensuring WCAG 2.1 compliance before handoff.',
      techStack: 'Figma Plugin API, TypeScript, React',
      link: '',
      repoUrl: 'github.com/schen-design/a11y-audit',
    },
  ],
  skills: [
    'Figma',
    'Sketch',
    'Adobe XD',
    'Prototyping',
    'User Research',
    'Wireframing',
    'HTML',
    'CSS',
    'Sass',
    'Storybook',
    'Accessibility (WCAG)',
    'Design Systems',
  ],
  education: {
    degree: 'BFA in Interaction Design',
    school: 'California College of the Arts',
    graduationYear: '2019',
    isSelfTaught: false,
  },
};

export const MOCK_ONBOARDING_FORM_VALUES_V3: OnboardingFormInput = {
  contact: {
    fullName: 'Michael Ross',
    email: 'm.ross@data.io',
    phone: '+44 20 7123 4567',
    location: 'London, UK',
    github: 'github.com/mross-data',
    linkedin: 'linkedin.com/in/michael-ross-ds',
    portfolio: 'mross-data.io',
  },
  summary:
    'Analytical Data Scientist with a strong background in machine learning and statistical modeling. Experienced in building predictive models, data pipelines, and visualizing complex datasets. Proficient in Python, SQL, and cloud infrastructure for deploying ML models.',
  experiences: [
    {
      id: 'datacorp-id',
      jobTitle: 'Data Scientist',
      company: 'DataCorp',
      startMonth: '09',
      startYear: '2023',
      endMonth: '',
      endYear: '',
      isCurrent: true,
      description:
        'Developing churn prediction models for a telecom client, achieving 85% accuracy. Building automated ETL pipelines using Apache Airflow and DBT. Creating interactive dashboards in Tableau for executive reporting.',
    },
    {
      id: 'fintech-inc-id',
      jobTitle: 'Junior Data Analyst',
      company: 'FinTech Inc.',
      startMonth: '07',
      startYear: '2021',
      endMonth: '08',
      endYear: '2023',
      isCurrent: false,
      description:
        'Analyzed transaction data to identify fraud patterns, reducing fraudulent activities by 15%. Assisted in the migration of on-premise data warehouses to AWS Redshift. Wrote complex SQL queries for ad-hoc business analysis.',
    },
  ],
  projects: [
    {
      id: 'fraud-detect-id',
      name: 'Real-time Fraud Detection',
      description:
        'A real-time fraud detection system using Random Forest and Gradient Boosting algorithms. Processes thousands of transactions per second with low latency.',
      techStack: 'Python, Scikit-learn, Kafka, AWS Lambda',
      link: '',
      repoUrl: 'github.com/mross-data/fraud-detect',
    },
    {
      id: 'stock-pred-id',
      name: 'Stock Price Predictor',
      description:
        'An experimental LSTM model to predict short-term stock price movements based on historical data and sentiment analysis of news headlines.',
      techStack: 'Python, TensorFlow, Keras, Pandas, NLP',
      link: 'https://stock-pred-demo.herokuapp.com',
      repoUrl: 'github.com/mross-data/stock-pred',
    },
  ],
  skills: [
    'Python',
    'R',
    'SQL',
    'TensorFlow',
    'PyTorch',
    'Scikit-learn',
    'Pandas',
    'NumPy',
    'Tableau',
    'Power BI',
    'AWS',
    'Spark',
    'Airflow',
    'Git',
  ],
  education: {
    degree: 'MS in Data Science',
    school: 'Imperial College London',
    graduationYear: '2021',
    isSelfTaught: false,
  },
};

export const MOCK_ONBOARDING_EMPTY_FORM_VALUES: OnboardingFormInput = {
  contact: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    github: '',
    linkedin: '',
    portfolio: '',
  },
  summary: '',
  experiences: [],
  projects: [],
  skills: [],
  education: {
    degree: '',
    school: '',
    graduationYear: '',
    isSelfTaught: false,
  },
};

export const MOCK_ONBOARDING_MAX_LIMITS_FORM_VALUES: OnboardingFormInput = {
  contact: {
    fullName: 'Max Limit User',
    email: 'max.limit.user@example.com',
    phone: '+1 555 000 0000',
    location: 'Remote',
    github: 'github.com/max-limit-user',
    linkedin: 'linkedin.com/in/max-limit-user',
    portfolio: 'maxlimit.dev',
  },
  summary:
    'Full-stack engineer focused on building reliable web products with measurable impact across web apps, APIs, and infrastructure. Comfortable owning end-to-end delivery from scoping and design to implementation, monitoring, and iteration with stakeholders. Known for improving performance, reducing defects, and shipping high-quality features quickly while keeping code maintainable and ATS-friendly.',
  experiences: [
    {
      id: 'exp-max-01',
      jobTitle: 'Software Engineer I',
      company: 'Company 01',
      startMonth: '01',
      startYear: '2016',
      endMonth: '01',
      endYear: '2017',
      isCurrent: false,
      description:
        'Owned development of customer-facing features and internal tools, collaborating with design and product to deliver incremental releases. Improved page performance, refactored legacy UI patterns, and added unit/integration tests to reduce regressions. Built REST endpoints, wrote SQL queries, and instrumented logging/alerts for core workflows. Mentored peers through code reviews and documentation while improving developer experience. Delivered multiple projects on time by breaking work into milestones, communicating risks, and validating outcomes with users. Maintained high quality through PR standards, consistent linting, and pragmatic engineering tradeoffs. Helped improve reliability by adding retries, timeouts, and graceful error handling. Supported production incidents with root-cause analysis and follow-up fixes.',
    },
    {
      id: 'exp-max-02',
      jobTitle: 'Software Engineer II',
      company: 'Company 02',
      startMonth: '02',
      startYear: '2017',
      endMonth: '02',
      endYear: '2018',
      isCurrent: false,
      description:
        'Built and maintained scalable frontend components and backend APIs for a multi-tenant product. Implemented pagination, filtering, and role-based access control while ensuring secure data handling. Optimized slow queries and improved caching strategies to reduce latency in high-traffic endpoints. Partnered with QA to define test plans and created automated checks for critical flows. Introduced better observability dashboards and on-call runbooks to improve incident response. Worked closely with stakeholders to clarify requirements and ship iterative improvements. Reduced technical debt by migrating old modules to a shared design system. Ensured accessibility best practices and cross-browser support for core experiences.',
    },
    {
      id: 'exp-max-03',
      jobTitle: 'Software Engineer',
      company: 'Company 03',
      startMonth: '03',
      startYear: '2018',
      endMonth: '03',
      endYear: '2019',
      isCurrent: false,
      description:
        'Delivered new product capabilities end-to-end, including UI flows, API contracts, and database changes. Improved performance by reducing bundle size, optimizing rendering, and trimming unused dependencies. Added CI checks, improved code review guidelines, and standardized release notes. Built resilient background jobs and improved error handling for edge cases. Collaborated cross-functionally to validate designs and ship features that improved user satisfaction. Reduced support burden by adding better validation, self-serve tooling, and clearer UX messaging. Maintained clean architecture through modularization and consistent code patterns. Helped onboard new teammates and documented common workflows.',
    },
    {
      id: 'exp-max-04',
      jobTitle: 'Software Engineer',
      company: 'Company 04',
      startMonth: '04',
      startYear: '2019',
      endMonth: '04',
      endYear: '2020',
      isCurrent: false,
      description:
        'Implemented customer-requested features for a SaaS platform with attention to usability and reliability. Built reusable UI components, validated forms, and improved navigation patterns. Designed and shipped API endpoints with proper validation, pagination, and rate limiting. Tuned database indexes and improved query performance for reporting screens. Added integration tests for high-value flows and improved monitoring to detect regressions early. Collaborated with customer support to triage issues and deliver fixes quickly. Improved developer productivity via scripts, templates, and clearer local setup docs. Kept code maintainable through refactoring and consistent patterns.',
    },
    {
      id: 'exp-max-05',
      jobTitle: 'Software Engineer',
      company: 'Company 05',
      startMonth: '05',
      startYear: '2020',
      endMonth: '05',
      endYear: '2021',
      isCurrent: false,
      description:
        'Shipped product enhancements across frontend and backend, ensuring strong typing and predictable state management. Implemented secure authentication and authorization flows and improved session handling. Built dashboards with filtering and export features, improving customer visibility into key metrics. Optimized API response times by adding caching and reducing payload sizes. Partnered with design to refine UI components and improve accessibility compliance. Improved CI reliability and added smoke tests for critical journeys. Reduced bugs by tightening validation and adding edge-case coverage. Helped drive consistent engineering practices across the team.',
    },
    {
      id: 'exp-max-06',
      jobTitle: 'Software Engineer',
      company: 'Company 06',
      startMonth: '06',
      startYear: '2021',
      endMonth: '06',
      endYear: '2022',
      isCurrent: false,
      description:
        'Built and maintained a data-heavy UI with complex tables, search, and saved filters. Improved frontend performance by optimizing rendering and memoization patterns. Implemented backend endpoints with clear contracts and improved error handling semantics. Added monitoring and alerting to catch failures and reduce MTTR. Coordinated with product to prioritize high-impact improvements and reduce churn drivers. Improved documentation and onboarding for new engineers. Standardized code style and encouraged small PRs for faster iteration. Delivered improvements while keeping stability high.',
    },
    {
      id: 'exp-max-07',
      jobTitle: 'Senior Software Engineer',
      company: 'Company 07',
      startMonth: '07',
      startYear: '2022',
      endMonth: '07',
      endYear: '2023',
      isCurrent: false,
      description:
        'Led delivery of multiple features from discovery to release, aligning technical execution with business goals. Implemented robust patterns for feature flags, migrations, and backward compatibility. Improved reliability by addressing flaky jobs and strengthening retry/timeout policies. Tuned performance for key pages and reduced API latency through profiling and caching. Partnered with stakeholders to define scope, de-risk timelines, and ship iteratively. Mentored teammates through pairing and reviews, raising code quality and consistency. Wrote clear technical docs and supported incident response with root-cause analysis. Delivered measurable improvements in UX and system stability.',
    },
    {
      id: 'exp-max-08',
      jobTitle: 'Senior Software Engineer',
      company: 'Company 08',
      startMonth: '08',
      startYear: '2023',
      endMonth: '08',
      endYear: '2024',
      isCurrent: false,
      description:
        'Drove improvements across the stack, focusing on performance, reliability, and developer experience. Built new UI flows with strong validation and clear user feedback. Implemented API changes with migrations and safe rollout plans. Improved observability with dashboards, logs, and alerts for critical paths. Reduced errors by adding consistent input validation and better edge-case handling. Collaborated cross-functionally to ship features that improved adoption and retention. Documented best practices and helped standardize release processes. Maintained high delivery velocity with predictable iteration cycles.',
    },
    {
      id: 'exp-max-09',
      jobTitle: 'Lead Software Engineer',
      company: 'Company 09',
      startMonth: '09',
      startYear: '2024',
      endMonth: '09',
      endYear: '2025',
      isCurrent: false,
      description:
        'Led technical execution for a team shipping customer-facing features and platform improvements. Set standards for code quality, testing, and release safety, improving overall reliability. Designed scalable APIs and improved data access patterns for performance. Implemented better error handling and monitoring to reduce incident frequency. Worked with product to prioritize roadmap items and ensure clear acceptance criteria. Mentored engineers and improved onboarding through documentation and templates. Delivered incremental improvements with regular feedback loops. Balanced speed and quality to ship consistently.',
    },
    {
      id: 'exp-max-10',
      jobTitle: 'Lead Software Engineer',
      company: 'Company 10',
      startMonth: '10',
      startYear: '2025',
      endMonth: '',
      endYear: '',
      isCurrent: true,
      description:
        'Owning delivery of high-impact initiatives across frontend and backend, emphasizing performance, stability, and maintainability. Building reusable components, improving API design, and strengthening observability to catch issues early. Collaborating with stakeholders to define scope and deliver in small, measurable iterations. Improving CI/CD, test coverage, and developer tooling to raise overall velocity. Driving best practices in code review, documentation, and incident response. Supporting product growth by improving onboarding flows and reducing friction in key journeys. Ensuring accessible and responsive UI patterns across devices. Continuously refining architecture to keep the system scalable.',
    },
  ],
  projects: [
    {
      id: 'proj-max-01',
      name: 'Project 01',
      description:
        'Built a production-ready web app with authentication, data persistence, and polished UI flows. Implemented dashboards, search, and export features with strong validation and clear UX feedback. Focused on maintainable architecture, testing, and performance optimization for real users at scale.',
      techStack:
        'Next.js, TypeScript, React, Node.js, PostgreSQL, Prisma, Tailwind CSS, Docker, AWS, Redis, CI/CD, Testing, Observability, Caching, Auth',
      link: 'https://example.com/project-1',
      repoUrl: 'github.com/max-limit-user/project-1',
    },
    {
      id: 'proj-max-02',
      name: 'Project 02',
      description:
        'Shipped an internal tooling platform to streamline common workflows and reduce manual effort. Added role-based access, audit logs, and robust error handling. Improved reliability with monitoring, retries, and clear operational documentation for on-call support.',
      techStack:
        'Next.js, TypeScript, React, Node.js, PostgreSQL, Prisma, Tailwind CSS, Docker, AWS, Redis, CI/CD, Testing, Monitoring, Logging, RBAC',
      link: 'https://example.com/project-2',
      repoUrl: 'github.com/max-limit-user/project-2',
    },
    {
      id: 'proj-max-03',
      name: 'Project 03',
      description:
        'Created a data-heavy analytics dashboard with filters, saved views, and fast rendering. Optimized API payloads and caching strategies to keep interactions snappy. Included automated tests, CI checks, and performance profiling to prevent regressions.',
      techStack:
        'Next.js, TypeScript, React, Node.js, PostgreSQL, Prisma, Tailwind CSS, Docker, AWS, Redis, CI/CD, Testing, Performance, Caching',
      link: 'https://example.com/project-3',
      repoUrl: 'github.com/max-limit-user/project-3',
    },
    {
      id: 'proj-max-04',
      name: 'Project 04',
      description:
        'Built a job application helper that organizes projects, experience, and skills into structured data. Implemented form flows, validation, and PDF export with a clean ATS-friendly layout. Focused on usability, accessibility, and reliable generation results.',
      techStack:
        'Next.js, TypeScript, React, Node.js, PostgreSQL, Prisma, Tailwind CSS, Docker, AWS, Redis, CI/CD, Testing, PDF, Accessibility',
      link: 'https://example.com/project-4',
      repoUrl: 'github.com/max-limit-user/project-4',
    },
    {
      id: 'proj-max-05',
      name: 'Project 05',
      description:
        'Delivered a lightweight CRM-style prototype with contact management, notes, and task tracking. Added search, filtering, and basic reporting. Emphasized modular components, consistent state handling, and strong input validation throughout.',
      techStack:
        'Next.js, TypeScript, React, Node.js, PostgreSQL, Prisma, Tailwind CSS, Docker, AWS, Redis, CI/CD, Testing, Forms, Validation',
      link: 'https://example.com/project-5',
      repoUrl: 'github.com/max-limit-user/project-5',
    },
    {
      id: 'proj-max-06',
      name: 'Project 06',
      description:
        'Built a multi-step onboarding experience with progressive disclosure, good defaults, and clear guidance. Added guardrails for max lengths/counts and improved long-running generation UX with reassuring messaging. Prioritized fast completion and clean data shape.',
      techStack:
        'Next.js, TypeScript, React, Node.js, PostgreSQL, Prisma, Tailwind CSS, Docker, AWS, Redis, CI/CD, Testing, Zod, React Hook Form',
      link: 'https://example.com/project-6',
      repoUrl: 'github.com/max-limit-user/project-6',
    },
  ],
  skills: [
    'Skill-01',
    'Skill-02',
    'Skill-03',
    'Skill-04',
    'Skill-05',
    'Skill-06',
    'Skill-07',
    'Skill-08',
    'Skill-09',
    'Skill-10',
    'Skill-11',
    'Skill-12',
    'Skill-13',
    'Skill-14',
    'Skill-15',
    'Skill-16',
    'Skill-17',
    'Skill-18',
    'Skill-19',
    'Skill-20',
    'Skill-21',
    'Skill-22',
    'Skill-23',
    'Skill-24',
    'Skill-25',
    'Skill-26',
    'Skill-27',
    'Skill-28',
    'Skill-29',
    'Skill-30',
    'Skill-31',
    'Skill-32',
    'Skill-33',
    'Skill-34',
    'Skill-35',
    'Skill-36',
    'Skill-37',
    'Skill-38',
    'Skill-39',
    'Skill-40',
    'Skill-41',
    'Skill-42',
    'Skill-43',
    'Skill-44',
    'Skill-45',
    'Skill-46',
    'Skill-47',
    'Skill-48',
    'Skill-49',
    'Skill-50',
  ],
  education: {
    degree: 'BSc Computer Science',
    school: 'Example University',
    graduationYear: '2020',
    isSelfTaught: false,
  },
};

const fillOptions = [
  MOCK_ONBOARDING_FORM_VALUES,
  MOCK_ONBOARDING_FORM_VALUES_V2,
  MOCK_ONBOARDING_FORM_VALUES_V3,
  MOCK_ONBOARDING_EMPTY_FORM_VALUES,
  MOCK_ONBOARDING_MAX_LIMITS_FORM_VALUES,
];

let currentFillIndex = 0;

export const fillValues = () => {
  const value = fillOptions[currentFillIndex];
  currentFillIndex = (currentFillIndex + 1) % fillOptions.length;
  return value;
};
