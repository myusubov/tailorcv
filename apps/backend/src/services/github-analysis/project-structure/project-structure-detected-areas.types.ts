import type { EntryIndex } from './project-structure-entry-index';

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
  | 'Infrastructure/config';

/**
 * Internal mutable candidate accumulated while path rules add score and evidence.
 * Candidates are keyed by area name and owner path so monorepos can emit multiple areas.
 */
export interface AreaCandidate {
  name: DetectedAreaName;
  path: string;
  score: number;
  evidence: Set<string>;
}

/**
 * Shared state passed into detected-area rule groups.
 */
export interface DetectedAreaRuleContext {
  candidates: Map<string, AreaCandidate>;
  index: EntryIndex;
}
