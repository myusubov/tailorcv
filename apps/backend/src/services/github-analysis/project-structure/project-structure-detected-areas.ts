import { buildEntryIndex } from './project-structure-entry-index';
import { toDetectedProjectAreas } from './project-structure-detected-area-candidates';
import { applyDetectedAreaRules } from './project-structure-detected-area-rules';
import type {
  DetectedProjectArea,
  ProjectStructureSummary,
  RepoTreeEntry,
} from './project-structure-analyzer.types';
import type {
  AreaCandidate,
  DetectedAreaName,
} from './project-structure-detected-areas.types';

function sortPriority({
  area,
  summary,
}: {
  area: DetectedProjectArea;
  summary: ProjectStructureSummary;
}): number {
  const fullStackOrder: DetectedAreaName[] = [
    'Frontend app',
    'Backend API',
    'Shared package',
    'Database schema',
    'Test suite',
    'Documentation',
    'CI/CD workflows',
    'Containerization',
    'Infrastructure/config',
    'CLI tooling',
    'Mobile app',
  ];
  const backendOrder: DetectedAreaName[] = [
    'Backend API',
    'Database schema',
    'Test suite',
    'Documentation',
    'CI/CD workflows',
    'Containerization',
    'Infrastructure/config',
    'Shared package',
    'Frontend app',
    'CLI tooling',
    'Mobile app',
  ];
  const frontendOrder: DetectedAreaName[] = [
    'Frontend app',
    'Test suite',
    'Documentation',
    'CI/CD workflows',
    'Containerization',
    'Infrastructure/config',
    'Shared package',
    'Backend API',
    'CLI tooling',
    'Mobile app',
  ];

  const order =
    summary.projectShape.includes('backend') &&
    !summary.projectShape.includes('frontend') &&
    !summary.projectShape.includes('full-stack')
      ? backendOrder
      : summary.projectShape.includes('frontend')
        ? frontendOrder
        : fullStackOrder;

  return order.indexOf(area.name as DetectedAreaName);
}

/**
 * Builds meaningful repository regions from path-level evidence only.
 * Later analyzers can use these areas as a cheap map for where resume-relevant evidence may live.
 */
export function buildDetectedAreas({
  entries,
  summary,
}: {
  entries: RepoTreeEntry[];
  summary: ProjectStructureSummary;
}): DetectedProjectArea[] {
  const index = buildEntryIndex({ entries });
  const candidates = new Map<string, AreaCandidate>();

  if (index.paths.length === 0) return [];

  applyDetectedAreaRules({ candidates, index });

  return toDetectedProjectAreas({ candidates: [...candidates.values()] }).sort(
    (a, b) => {
      const priorityA = sortPriority({ area: a, summary });
      const priorityB = sortPriority({ area: b, summary });

      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.confidence !== b.confidence) return b.confidence - a.confidence;
      return a.path.localeCompare(b.path);
    },
  );
}
