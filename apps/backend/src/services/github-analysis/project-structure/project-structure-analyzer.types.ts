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
 * Maturity level for a structure-derived engineering practice area.
 */
export type MaturityLevel =
  | 'unknown'
  | 'weak'
  | 'basic'
  | 'moderate'
  | 'strong';

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
 * High-level repository shape summary derived from normalized tree entries.
 */
export interface ProjectStructureSummary {
  projectShape: string;
  inferredStack: string[];
  totalFiles: number;
  topLevelFolders: string[];
  maxDepth: number;
  isTreeTruncated: boolean;
}

/**
 * Technology labels inferred for a detected repository area from path evidence.
 */
export type DetectedAreaTechnology =
  | '.NET'
  | 'ASP.NET Core'
  | 'Blade'
  | 'C#'
  | 'Django'
  | 'ERB'
  | 'Express.js'
  | 'Java'
  | 'Kotlin'
  | 'Laravel'
  | 'NestJS'
  | 'Next.js'
  | 'PHP'
  | 'Python'
  | 'React'
  | 'React Router'
  | 'Ruby'
  | 'Ruby on Rails'
  | 'Nuxt'
  | 'Vue'
  | 'Angular'
  | 'SvelteKit'
  | 'Svelte'
  | 'Astro'
  | 'Spring Boot'
  | 'Static Web'
  | 'Node.js'
  | 'Prisma'

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
  name: string;
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
 * Structure-derived maturity signal for quality areas such as tests, database, docs, or deployment.
 */
export interface MaturitySignal {
  area: string;
  level: MaturityLevel;
  confidence: number;
  evidence: string[];
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
  maturitySignals: MaturitySignal[];
  candidateFilesToInspect: CandidateFileToInspect[];
  resumeSignalHints: ResumeSignalHint[];
  feedback: ProjectStructureFeedback;
}
