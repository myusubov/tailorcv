import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import {
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';

/**
 * Defines the planned path-only Podman/OCI signal and scoring contract.
 * Basename matching is implemented, while ownership, signal counting,
 * technology attribution, and emission remain intentionally disabled.
 */
type PodmanOciContainerizationSignal =
  | 'podman-quadlet-container-unit'
  | 'podman-quadlet-pod-unit'
  | 'podman-quadlet-kube-unit'
  | 'podman-quadlet-build-unit'
  | 'podman-quadlet-image-unit'
  | 'podman-quadlet-network-unit'
  | 'podman-quadlet-volume-unit'
  | 'podman-quadlet-artifact-unit'
  | 'oci-container-build-file'
  | 'oci-container-ignore-file';

const PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES = {
  'podman-quadlet-container-unit': 4,
  'podman-quadlet-pod-unit': 4,
  'podman-quadlet-kube-unit': 4,
  'podman-quadlet-build-unit': 4,
  'podman-quadlet-image-unit': 3,
  'podman-quadlet-network-unit': 2,
  'podman-quadlet-volume-unit': 2,
  'podman-quadlet-artifact-unit': 2,
  'oci-container-build-file': 2,
  'oci-container-ignore-file': 1,
} satisfies AreaRuleSignalScores<PodmanOciContainerizationSignal>;

/**
 * Keeps Podman/OCI area emission disabled while the detector is scaffolded.
 *
 * @param countedSignals - Podman/OCI signals counted once for one owner.
 * @returns Always `false`; the scaffold cannot unlock area emission.
 *
 * @remarks This pure placeholder has no side effects. Collected filenames do
 * not unlock output until ownership, signal counting, and the real gate are
 * implemented and approved.
 */
function hasPodmanOciContainerizationAreaShape(
  countedSignals: Set<PodmanOciContainerizationSignal>,
): boolean {
  // No collected signal may emit a candidate before the real gate is approved.
  return false;
}

/**
 * Collects planned Podman/OCI evidence filenames without emitting areas.
 *
 * @param context - Shared detected-area candidates and normalized entry index;
 * the index supplies matching files while candidates remain unchanged.
 * @returns Nothing; the scaffold only prepares local evidence collections.
 *
 * @remarks Quadlet and generic OCI build signals can appear at repo root or in
 * many configuration folders, so collection matches file basenames without a
 * required directory. Owner resolution, exclusions, signal counting,
 * technology attribution, and emission remain intentionally unimplemented.
 */
export function addPodmanOciContainerizationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const podmanOciAreasByOwner =
    createAreaRuleCandidateMap<PodmanOciContainerizationSignal>();

  const containerUnitFiles = index.findFilesByNameMatching({
    pattern: /^.+\.container$/,
  });

  const podUnitFiles = index.findFilesByNameMatching({
    pattern: /^.+\.pod$/,
  });

  const kubeUnitFiles = index.findFilesByNameMatching({
    pattern: /^.+\.kube$/,
  });

  const buildUnitFiles = index.findFilesByNameMatching({
    pattern: /^.+\.build$/,
  });

  const imageUnitFiles = index.findFilesByNameMatching({
    pattern: /^.+\.image$/,
  });

  const networkUnitFiles = index.findFilesByNameMatching({
    pattern: /^.+\.network$/,
  });

  const volumeUnitFiles = index.findFilesByNameMatching({
    pattern: /^.+\.volume$/,
  });

  const artifactUnitFiles = index.findFilesByNameMatching({
    pattern: /^.+\.artifact$/,
  });

  const containerBuildFiles = index.findFilesByNameMatching({
    pattern: /^containerfile(?:\.[^/]+)?$/,
  });

  const containerIgnoreFiles = index.findFilesByNameMatching({
    pattern: /^\.containerignore$/,
  });
}
