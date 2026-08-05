import { buildDetectedAreas } from './project-structure-detected-areas';
import { buildProjectStructureSummary } from './project-structure-summary';
import type {
  AnalyzeProjectStructureInput,
  ArchitectureSignal,
  CandidateFileToInspect,
  MaturitySignal,
  ProjectStructureAnalysisResult,
  ProjectStructureFeedback,
  RepoTreeEntry,
  ResumeSignalHint,
} from './project-structure-analyzer.types';

export type {
  AnalysisPriority,
  AnalyzeProjectStructureInput,
  ArchitectureSignal,
  CandidateFileToInspect,
  DetectedAreaTechnology,
  DetectedProjectArea,
  InferredAreaTechnologies,
  MaturityLevel,
  MaturitySignal,
  ProjectStructureAnalysisResult,
  ProjectStructureFeedback,
  ProjectStructureGap,
  ProjectStructureImprovementSuggestion,
  ProjectStructureLimitation,
  ProjectStructureRepository,
  ProjectStructureSummary,
  RepoTreeEntry,
  RepoTreeEntryType,
  ResumeSignalHint,
  SignalStrength,
} from './project-structure-analyzer.types';

function buildArchitectureSignals({
  entries,
}: {
  entries: RepoTreeEntry[];
}): ArchitectureSignal[] {
  void entries;
  return [];
}

function buildMaturitySignals({
  entries,
}: {
  entries: RepoTreeEntry[];
}): MaturitySignal[] {
  void entries;
  return [];
}

function buildCandidateFilesToInspect({
  entries,
}: {
  entries: RepoTreeEntry[];
}): CandidateFileToInspect[] {
  void entries;
  return [];
}

function buildResumeSignalHints({
  entries,
}: {
  entries: RepoTreeEntry[];
}): ResumeSignalHint[] {
  void entries;
  return [];
}

function buildFeedback({
  entries,
}: {
  entries: RepoTreeEntry[];
}): ProjectStructureFeedback {
  void entries;
  return {
    gaps: [],
    limitations: [],
    improvementSuggestions: [],
  };
}

/**
 * Analyzes one repository tree using path-level metadata only.
 * Returns a prototype structure report that later GitHub analyzers can use as a repo map.
 */
export function analyzeProjectStructure(
  input: AnalyzeProjectStructureInput,
): ProjectStructureAnalysisResult {
  const { repository, entries, isTruncated } = input;
  const summary = buildProjectStructureSummary({ entries, isTruncated });
  const detectedAreas = buildDetectedAreas({ entries, summary });
  const architectureSignals = buildArchitectureSignals({ entries });
  const maturitySignals = buildMaturitySignals({ entries });
  const candidateFilesToInspect = buildCandidateFilesToInspect({ entries });
  const resumeSignalHints = buildResumeSignalHints({ entries });
  const feedback = buildFeedback({ entries });

  return {
    repository,
    summary,
    detectedAreas,
    architectureSignals,
    maturitySignals,
    candidateFilesToInspect,
    resumeSignalHints,
    feedback,
  };
}
