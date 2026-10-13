import type { DetectedAreaName } from './project-structure-detected-areas.types';

/**
 * Repository tree entry kinds supported by the project structure analyzer.
 */
export type RepoTreeEntryType = 'file' | 'directory' | 'submodule';

/**
 * Prototype priority level used for feedback and improvement guidance.
 */
export type AnalysisPriority = 'low' | 'medium' | 'high';

/**
 * Strength of a possible resume signal inferred from repository structure.
 */
export type SignalStrength = 'weak' | 'moderate' | 'strong';

/**
 * Normalized repository metadata required by the project structure analyzer.
 * Keeps only identity fields because tree fetching and GitHub API concerns live outside the analyzer.
 */
export interface ProjectStructureRepository {
  id: number;
  repositoryFullName: string;
}

/**
 * Normalized file-tree entry produced before analysis from the GitHub tree API.
 * The analyzer uses this path-level metadata to infer structure without reading full file contents.
 */
export interface RepoTreeEntry {
  path: string;
  name: string;
  type: RepoTreeEntryType;
  depth: number;
  parentPath: string | null;
  extension: string | null;
  sizeBytes: number | null;
}

/**
 * Input contract for analyzing one repository's project structure.
 * Callers provide an already-fetched normalized tree so the analyzer stays pure and testable.
 */
export interface AnalyzeProjectStructureInput {
  repository: ProjectStructureRepository;
  entries: RepoTreeEntry[];
  isTruncated: boolean;
}

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
 * Infrastructure-as-code tool labels inferred for detected infrastructure-as-code areas.
 * v1 scope only. Currently `Terraform` (primary) with `OpenTofu` (related),
 * `Helm` (primary) with `Kubernetes` (related), `Bicep` (primary) with
 * `Azure` (related), `AWS CDK` (primary) with `AWS` (related), `Pulumi`
 * (primary, no related technology), and `Ansible` (primary, no related
 * technology) are emitted.
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
 * Documentation-framework labels inferred for detected documentation areas.
 * Currently `Sphinx` and `MkDocs` (each primary, `Python` related),
 * `Docusaurus` (primary, `React` related), `mdBook` (primary, `Rust`
 * related), `Starlight` (primary, `Astro` related), `DocFX` (primary, `.NET`
 * related), `Antora` (primary, `Node.js` related), `Fumadocs`, `Dumi` and
 * `Rspress` (each primary, `React` related), and `VitePress` and `VuePress`
 * (each primary, `Vue` related) are emitted.
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
 * Structure-derived architecture signal that may support later resume evidence.
 */
export interface ArchitectureSignal {
  signal: string;
  confidence: number;
  evidence: string[];
  whyItMatters: string;
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
 * File path that later analyzers should inspect because structure suggests it is high value.
 */
export interface CandidateFileToInspect {
  path: string;
  priority: number;
  reason: string;
}

/**
 * Early resume-oriented hint inferred from structure before deeper source-code analysis.
 */
export interface ResumeSignalHint {
  hint: string;
  strength: SignalStrength;
  basedOn: string[];
}

/**
 * Missing or weak structural signal that limits resume generation quality.
 */
export interface ProjectStructureGap {
  area: string;
  issue: string;
  impact: string;
  suggestion: string;
  priority: AnalysisPriority;
}

/**
 * Known boundary of what project-structure analysis can prove on its own.
 */
export interface ProjectStructureLimitation {
  issue: string;
  impact: string;
}

/**
 * Practical repo improvement suggestion for making future resume evidence stronger.
 */
export interface ProjectStructureImprovementSuggestion {
  priority: AnalysisPriority;
  suggestion: string;
}

/**
 * Feedback output for weak, incomplete, or unclear repository structure.
 */
export interface ProjectStructureFeedback {
  gaps: ProjectStructureGap[];
  limitations: ProjectStructureLimitation[];
  improvementSuggestions: ProjectStructureImprovementSuggestion[];
}

/**
 * Prototype output contract for project structure analysis.
 * Includes both resume evidence candidates and feedback so weak repositories still produce useful guidance.
 */
export interface ProjectStructureAnalysisResult {
  repository: ProjectStructureRepository;
  summary: ProjectStructureSummary;
  detectedAreas: DetectedProjectArea[];
  architectureSignals: ArchitectureSignal[];
  maturitySignals: MaturitySignals;
  candidateFilesToInspect: CandidateFileToInspect[];
  resumeSignalHints: ResumeSignalHint[];
  feedback: ProjectStructureFeedback;
}
