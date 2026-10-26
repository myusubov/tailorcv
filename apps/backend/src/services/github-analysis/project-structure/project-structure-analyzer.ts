import { buildArchitectureSignals } from './project-structure-architecture-signals';
import { buildCandidateFilesToInspect } from './project-structure-candidate-files';
import { buildDetectedAreas } from './project-structure-detected-areas';
import { buildMaturitySignals } from './project-structure-maturity-signals';
import { buildProjectStructureSummary } from './project-structure-summary';
import type {
  AnalyzeProjectStructureInput,
  ProjectStructureAnalysisResult,
  ProjectStructureFeedback,
  RepoTreeEntry,
  ResumeSignalHint,
} from './project-structure-analyzer.types';

export type {
  AnalysisPriority,
  AnalyzeProjectStructureInput,
  ArchitectureSignal,
  ArchitectureSignalName,
  CandidateFileToInspect,
  DetectedAreaTechnology,
  DetectedProjectArea,
  InferredAreaTechnologies,
  MaturitySignals,
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
  RootManifest,
  RootManifestEcosystem,
  SignalStrength,
} from './project-structure-analyzer.types';

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
  const maturitySignals = buildMaturitySignals({
    entries,
    detectedAreas,
  });
  const architectureSignals = buildArchitectureSignals({
    entries,
    detectedAreas,
  });
  const candidateFilesToInspect = buildCandidateFilesToInspect({
    entries,
    detectedAreas,
  });
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
