import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

/**
 * Placeholder for the Azure Bicep infrastructure-as-code detector.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}`
 * map, mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: none yet. This is an unimplemented placeholder wired into
 * dispatch ahead of its own signal-type/score/gate research pass. Intended
 * once implemented: an `Infrastructure as code` candidate with primary
 * technology `Bicep` and related technology `Azure`.
 * Limitations: contributes zero candidates until entry schemas and a gate
 * are added.
 */
export function addBicepInfrastructureAsCodeAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {}
