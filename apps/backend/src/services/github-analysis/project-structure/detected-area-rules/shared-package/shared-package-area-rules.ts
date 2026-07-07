import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { AreaRuleSignalScores, createAreaRuleCandidateMap } from '../project-structure-area-rule-candidates';


type SharedPackageSignal = 'shared-package-workspace-manifest'


const SHARED_PACKAGE_SIGNAL_SCORES = {
  'shared-package-workspace-manifest': 4
} satisfies AreaRuleSignalScores<SharedPackageSignal>;


/**
 * Applies shared-package detected-area rules.
 * These rules emit `Shared package` candidates for reusable workspace package
 * areas such as `packages/shared`, `packages/ui`, or `libs/shared`.
 */
export function addSharedPackageAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const sharedPackageAreasByOwner = createAreaRuleCandidateMap<SharedPackageSignal>();




}
