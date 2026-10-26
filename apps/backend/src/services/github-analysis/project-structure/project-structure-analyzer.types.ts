import type {
  ArchitectureSignal,
  DetectedProjectArea,
  MaturitySignals,
  ProjectStructureSummary,
} from 'shared';

// These types are shared with the frontend through the analyze response, so
// they live in `shared`. Re-exported here so analyzer modules keep importing
// them from this file.
export type {
  ArchitectureSignal,
  ArchitectureSignalName,
  BackendDetectedAreaTechnology,
  CiCdDetectedAreaTechnology,
  ContainerizationDetectedAreaTechnology,
  DatabaseDetectedAreaTechnology,
  DetectedAreaTechnology,
  DetectedProjectArea,
  DocumentationDetectedAreaTechnology,
  FrontendDetectedAreaTechnology,
  InferredAreaTechnologies,
  InfrastructureAsCodeDetectedAreaTechnology,
  MaturitySignals,
  MobileDetectedAreaTechnology,
  ProjectStructureSummary,
  RootManifest,
  RootManifestEcosystem,
  RuntimeDetectedAreaTechnology,
  TemplateDetectedAreaTechnology,
  TestDetectedAreaTechnology,
} from 'shared';

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
 * File path that later analyzers should inspect because structure suggests it is high value.
 */
export type CandidateFileToInspect = string;

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
