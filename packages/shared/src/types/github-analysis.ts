/**
 * Dependency-ecosystem labels attached to a detected root manifest file.
 * Intentionally limited to widely used ecosystems; more are added on demand.
 */
export type RootManifestEcosystem =
  | 'Node.js'
  | 'Python'
  | 'Go'
  | 'Rust'
  | 'Java/Kotlin'
  | 'Ruby'
  | 'PHP';

/**
 * A dependency manifest present at the repository root, recorded by presence
 * and ecosystem only; the file contents are not read.
 */
export interface RootManifest {
  file: string;
  ecosystem: RootManifestEcosystem;
}

/**
 * High-level repository shape summary derived from normalized tree entries.
 */
export interface ProjectStructureSummary {
  projectShape: string;
  inferredStack: string[];
  totalFiles: number;
  topLevelFolders: string[];
  maxDepth: number;
  isTreeTruncated: boolean;
  detectedLanguages: string[];
  rootManifests: RootManifest[];
}

/**
 * Frontend technology labels inferred for detected user-interface areas.
 */
export type FrontendDetectedAreaTechnology =
  | 'Angular'
  | 'Astro'
  | 'Next.js'
  | 'Nuxt'
  | 'React'
  | 'React Router'
  | 'Svelte'
  | 'SvelteKit'
  | 'Static Web'
  | 'Vue';

/**
 * Backend framework labels inferred for detected API/server areas.
 */
export type BackendDetectedAreaTechnology =
  | 'ASP.NET Core'
  | 'Django'
  | 'Express.js'
  | 'Laravel'
  | 'NestJS'
  | 'Ruby on Rails'
  | 'Spring Boot';

/**
 * Containerization tool labels inferred for detected containerization areas.
 */
export type ContainerizationDetectedAreaTechnology =
  | 'Docker'
  | 'Podman/OCI'
  | 'Quadlet';

/**
 * Runtime, language, and platform context attached to detected areas.
 */
export type RuntimeDetectedAreaTechnology =
  | '.NET'
  | 'AWS'
  | 'Azure'
  | 'C#'
  | 'Dart'
  | 'Java'
  | 'Kotlin'
  | 'Kubernetes'
  | 'Node.js'
  | 'PHP'
  | 'Python'
  | 'Ruby'
  | 'Rust'
  | 'Swift';

/**
 * Template/view technology labels attached as related context.
 */
export type TemplateDetectedAreaTechnology = 'Blade' | 'ERB';

/**
 * Database tooling labels inferred for detected schema or migration areas.
 */
export type DatabaseDetectedAreaTechnology =
  | 'Alembic'
  | 'Drizzle'
  | 'Knex'
  | 'Prisma'
  | 'Sequelize'
  | 'SQLAlchemy'
  | 'TypeORM';

export type TestDetectedAreaTechnology =
  | 'Jest'
  | 'Vitest'
  | 'Mocha'
  | 'Cypress'
  | 'Playwright';

/**
 * CI/CD provider labels inferred for detected pipeline-as-code areas.
 */
export type CiCdDetectedAreaTechnology =
  | 'AppVeyor'
  | 'Azure Pipelines'
  | 'Bitbucket Pipelines'
  | 'Buildkite'
  | 'CircleCI'
  | 'Drone CI'
  | 'GitHub Actions'
  | 'GitLab CI/CD'
  | 'Jenkins'
  | 'TeamCity'
  | 'Travis CI'
  | 'Woodpecker CI';

/**
 * Mobile framework/platform labels inferred for detected mobile app areas.
 */
export type MobileDetectedAreaTechnology =
  | 'Android'
  | 'Expo'
  | 'Flutter'
  | 'iOS'
  | 'React Native';

/**
 * Infrastructure-as-code tool labels for detected infrastructure-as-code areas (v1 scope).
 * Terraform, Helm, Bicep and AWS CDK are primary with OpenTofu, Kubernetes, Azure
 * and AWS as the related technology; Pulumi and Ansible are primary with none.
 */
export type InfrastructureAsCodeDetectedAreaTechnology =
  | 'Ansible'
  | 'AWS CDK'
  | 'Bicep'
  | 'Helm'
  | 'OpenTofu'
  | 'Pulumi'
  | 'Terraform';

/**
 * Documentation-framework labels for detected documentation areas, each primary with
 * a related technology: Python (Sphinx, MkDocs), React (Docusaurus, Fumadocs, Dumi,
 * Rspress), Rust (mdBook), Astro (Starlight), .NET (DocFX), Node.js (Antora), Vue
 * (VitePress, VuePress).
 */
export type DocumentationDetectedAreaTechnology =
  | 'Sphinx'
  | 'MkDocs'
  | 'Docusaurus'
  | 'mdBook'
  | 'Starlight'
  | 'DocFX'
  | 'Antora'
  | 'Fumadocs'
  | 'VitePress'
  | 'VuePress'
  | 'Dumi'
  | 'Rspress';

/**
 * Technology labels inferred for a detected repository area from path evidence.
 */
export type DetectedAreaTechnology =
  | FrontendDetectedAreaTechnology
  | BackendDetectedAreaTechnology
  | ContainerizationDetectedAreaTechnology
  | RuntimeDetectedAreaTechnology
  | TemplateDetectedAreaTechnology
  | DatabaseDetectedAreaTechnology
  | TestDetectedAreaTechnology
  | CiCdDetectedAreaTechnology
  | MobileDetectedAreaTechnology
  | InfrastructureAsCodeDetectedAreaTechnology
  | DocumentationDetectedAreaTechnology;

/**
 * Primary and related technologies exposed for a detected repository area.
 */
export interface InferredAreaTechnologies {
  primary: DetectedAreaTechnology;
  related: DetectedAreaTechnology[];
}

/**
 * Detected project area such as frontend app, backend API, shared package, docs, or tooling.
 */
export interface DetectedProjectArea {
  name: DetectedAreaName;
  path: string;
  confidence: number;
  evidence: string[];
  inferredTechnologies: InferredAreaTechnologies;
}

/**
 * Architecture signal names emitted by the project-structure analyzer.
 */
export type ArchitectureSignalName =
  | 'Layered backend'
  | 'Client/server separation';

/**
 * Structure-derived architecture signal that may support later resume evidence.
 * `evidence` is `Tech @ path` for signals backed by detected areas and the repository path for signals backed by folders.
 */
export interface ArchitectureSignal {
  signal: ArchitectureSignalName;
  evidence: string[];
}

/**
 * One structure-derived practice check: whether the repository shows the practice, and why.
 * `evidence` is `Tech @ path` for checks backed by detected areas and the file path for checks backed by files, sorted.
 */
interface MaturityCheck {
  present: boolean;
  evidence: string[];
}

/**
 * Test and source file counts under one application area path.
 * `areaName` is the area's primary technology; `ratio` is test files divided by source files, rounded to 2 decimals, or `null` when there are no source files.
 */
interface TestingAreaCoverage {
  areaName: string;
  path: string;
  testFileCount: number;
  sourceFileCount: number;
  ratio: number | null;
}

/**
 * Testing check plus file counts.
 * `present` and `evidence` come from detected Test suite areas, so test files alone do not set `present`. `repoTotals` counts the whole repo; `byArea` has one row per application area, or a single row when a root code area exists.
 */
interface TestingMaturityCheck extends MaturityCheck {
  repoTotals: {
    testFileCount: number;
    sourceFileCount: number;
    ratio: number | null;
  };
  byArea: TestingAreaCoverage[];
}

/**
 * Structure-derived engineering-practice checks for one repository, used as deterministic maturity evidence.
 * Presence only: a check shows a practice is configured, not that it is done well. `coverage.met` counts present checks out of `coverage.total`.
 */
export interface MaturitySignals {
  testing: TestingMaturityCheck;
  automation: MaturityCheck;
  deployability: MaturityCheck;
  documentation: MaturityCheck;
  codeStyle: MaturityCheck;
  dependencyPinning: MaturityCheck;
  coverage: { met: number; total: number };
}

/**
 * Fixed v1 labels emitted by the project-structure detected-area analyzer.
 * These labels are intentionally conservative and path-derived.
 */
export type DetectedAreaName =
  | 'Frontend app'
  | 'Backend API'
  | 'Shared package'
  | 'Database schema'
  | 'Test suite'
  | 'Documentation'
  | 'CI/CD workflows'
  | 'Containerization'
  | 'CLI tooling'
  | 'Mobile app'
  | 'Infrastructure as code';

export interface GithubRepositoryMetadata {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  topics: string[];
  isFork: boolean;
  language: string | null;
}

/**
 * Content of one candidate file. `content` is null when GitHub reports the file
 * missing (404) or answers with something other than file text. `error` is not
 * set today: any other GitHub failure rejects the whole analysis.
 */
export interface CandidateFileContent {
  path: string;
  content: string | null;
  error?: string;
}

/**
 * Analysis result for one repository that was fetched and analyzed.
 */
export interface AnalyzedGithubRepository {
  repository: GithubRepositoryMetadata;
  summary: ProjectStructureSummary;
  detectedAreas: DetectedProjectArea[];
  maturitySignals: MaturitySignals;
  architectureSignals: ArchitectureSignal[];
  candidateFilesToInspect: string[];
  candidateFileContents: CandidateFileContent[];
}

/**
 * Response body data of the GitHub analyze endpoint.
 * `failedRepoIds` lists selected repositories that could not be analyzed.
 */
export interface AnalyzeGithubReposResponse {
  summaries: AnalyzedGithubRepository[];
  failedRepoIds: number[];
}
