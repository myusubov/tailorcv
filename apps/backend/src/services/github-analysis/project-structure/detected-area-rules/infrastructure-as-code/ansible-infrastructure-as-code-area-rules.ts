import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

/**
 * Placeholder for the Ansible infrastructure-as-code detector.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}`
 * map, mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: none yet. This is an unimplemented placeholder wired into
 * dispatch ahead of its own signal-type/score/gate research pass. Intended
 * once implemented: an `Infrastructure as code` candidate with primary
 * technology `Ansible`. No related technology is planned for v1.
 * Limitations: contributes zero candidates until entry schemas and a gate
 * are added. Ansible's evidence files (`*.yml` under `roles/`, `tasks/`,
 * `playbooks/`) are generic YAML, so its eventual gate will need a
 * combination requirement rather than a single anchor file -- see the
 * domain README's false-positive risk note.
 */
export function addAnsibleInfrastructureAsCodeAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {}
