import type { DetectedAreaName, DetectedAreaTechnology } from 'shared';
import type { EntryIndex } from './project-structure-entry-index';

// Shared with the frontend through the analyze response, so it lives in
// `shared`. Re-exported so rule modules keep importing it from this file.
export type { DetectedAreaName } from 'shared';

interface InferredAreaTechnologyCandidate {
  primary: DetectedAreaTechnology;
  related: Set<DetectedAreaTechnology>;
}

/**
 * Internal mutable candidate accumulated while path rules add score and evidence.
 * Candidates are keyed by area name and owner path so monorepos can emit multiple areas.
 */
export interface AreaCandidate {
  name: DetectedAreaName;
  path: string;
  score: number;
  evidence: Set<string>;
  inferredTechnologies: InferredAreaTechnologyCandidate;
}

/**
 * Shared state passed into detected-area rule groups.
 */
export interface DetectedAreaRuleContext {
  candidates: Map<string, AreaCandidate>;
  index: EntryIndex;
}
