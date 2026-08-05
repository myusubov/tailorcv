import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';

/**
 * Defines the path-only Podman/OCI signal contract used for owner-scoped
 * scoring and conservative combination-based emission.
 *
 * @remarks Basename matching cannot validate Quadlet file sections, so no
 * individual extension is treated as independently decisive. Core runtime and
 * build units receive more weight than support resources, while the final gate
 * requires a coherent multi-signal shape.
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
  'podman-quadlet-container-unit': 3,
  'podman-quadlet-pod-unit': 3,
  'podman-quadlet-kube-unit': 3,
  'podman-quadlet-build-unit': 3,
  'podman-quadlet-image-unit': 2,
  'podman-quadlet-network-unit': 1,
  'podman-quadlet-volume-unit': 1,
  'podman-quadlet-artifact-unit': 1,
  'oci-container-build-file': 1,
  'oci-container-ignore-file': 1,
} satisfies AreaRuleSignalScores<PodmanOciContainerizationSignal>;

/**
 * Determines whether one owner has a coherent Podman/OCI containerization
 * shape from multiple path-only signals.
 *
 * @param countedSignals - Podman/OCI signals counted once for one owner.
 * @returns `true` when a runtime definition has an independent Quadlet or OCI
 * build companion, or when a Quadlet build unit has a compatible build/runtime
 * companion; otherwise `false`.
 *
 * @remarks No basename-only signal can emit independently because extensions
 * such as `.container` and `.build` can collide with unrelated file formats.
 * Image, network, volume, artifact, and ignore signals remain support-only.
 * `.containerignore` contributes score and evidence after another combination
 * passes, but it never helps unlock the gate. This pure function has no side
 * effects and cannot validate Quadlet file contents.
 */
function hasPodmanOciContainerizationAreaShape(
  countedSignals: Set<PodmanOciContainerizationSignal>,
): boolean {
  const hasContainerUnit = countedSignals.has('podman-quadlet-container-unit');
  const hasPodUnit = countedSignals.has('podman-quadlet-pod-unit');
  const hasKubeUnit = countedSignals.has('podman-quadlet-kube-unit');
  const hasBuildUnit = countedSignals.has('podman-quadlet-build-unit');
  const hasImageUnit = countedSignals.has('podman-quadlet-image-unit');
  const hasNetworkUnit = countedSignals.has('podman-quadlet-network-unit');
  const hasVolumeUnit = countedSignals.has('podman-quadlet-volume-unit');
  const hasArtifactUnit = countedSignals.has('podman-quadlet-artifact-unit');
  const hasContainerBuildFile = countedSignals.has('oci-container-build-file');

  const hasRuntimeDefinition = hasContainerUnit || hasPodUnit || hasKubeUnit;
  const hasMultipleRuntimeDefinitions =
    (hasContainerUnit && (hasPodUnit || hasKubeUnit)) ||
    (hasPodUnit && hasKubeUnit);

  // Runtime units need a second independent signal because their extensions
  // alone cannot prove that the basename belongs to a real Quadlet definition.
  const hasRuntimeCompanion =
    hasMultipleRuntimeDefinitions ||
    hasBuildUnit ||
    hasImageUnit ||
    hasNetworkUnit ||
    hasVolumeUnit ||
    hasArtifactUnit ||
    hasContainerBuildFile;
  const hasRuntimeShape = hasRuntimeDefinition && hasRuntimeCompanion;

  // A build unit is accepted only with an image/build or runtime companion;
  // generic resource units cannot turn an unrelated `.build` file into proof.
  const hasBuildShape =
    hasBuildUnit &&
    (hasContainerBuildFile ||
      hasContainerUnit ||
      hasPodUnit ||
      hasKubeUnit ||
      hasImageUnit);

  return hasRuntimeShape || hasBuildShape;
}

/**
 * Detects owner-scoped Podman/OCI containerization areas from coherent groups
 * of Quadlet and OCI build paths.
 *
 * @param context - Shared detected-area candidates and normalized entry index;
 * the index supplies matching files and qualifying candidates are added to the
 * shared map.
 * @returns Nothing; qualifying owner candidates are added through side effects.
 *
 * @remarks Quadlet and generic OCI build signals can appear at repo root or in
 * many configuration folders, so collection matches file basenames without a
 * required directory. Signals are counted once per provisional application
 * owner. The combination gate prevents individual or support-only basenames
 * from emitting, but Podman-specific owner resolution and fixture/example path
 * exclusions remain separate unfinished work.
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

  for (const containerUnitFile of containerUnitFiles) {
    countAreaRuleSignal({
      areasByOwner: podmanOciAreasByOwner,
      entry: containerUnitFile,
      signal: 'podman-quadlet-container-unit',
      score:
        PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES[
          'podman-quadlet-container-unit'
        ],
    });
  }

  for (const podUnitFile of podUnitFiles) {
    countAreaRuleSignal({
      areasByOwner: podmanOciAreasByOwner,
      entry: podUnitFile,
      signal: 'podman-quadlet-pod-unit',
      score:
        PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES['podman-quadlet-pod-unit'],
    });
  }

  for (const kubeUnitFile of kubeUnitFiles) {
    countAreaRuleSignal({
      areasByOwner: podmanOciAreasByOwner,
      entry: kubeUnitFile,
      signal: 'podman-quadlet-kube-unit',
      score:
        PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES['podman-quadlet-kube-unit'],
    });
  }

  for (const buildUnitFile of buildUnitFiles) {
    countAreaRuleSignal({
      areasByOwner: podmanOciAreasByOwner,
      entry: buildUnitFile,
      signal: 'podman-quadlet-build-unit',
      score:
        PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES['podman-quadlet-build-unit'],
    });
  }

  for (const imageUnitFile of imageUnitFiles) {
    countAreaRuleSignal({
      areasByOwner: podmanOciAreasByOwner,
      entry: imageUnitFile,
      signal: 'podman-quadlet-image-unit',
      score:
        PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES['podman-quadlet-image-unit'],
    });
  }

  for (const networkUnitFile of networkUnitFiles) {
    countAreaRuleSignal({
      areasByOwner: podmanOciAreasByOwner,
      entry: networkUnitFile,
      signal: 'podman-quadlet-network-unit',
      score:
        PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES[
          'podman-quadlet-network-unit'
        ],
    });
  }

  for (const volumeUnitFile of volumeUnitFiles) {
    countAreaRuleSignal({
      areasByOwner: podmanOciAreasByOwner,
      entry: volumeUnitFile,
      signal: 'podman-quadlet-volume-unit',
      score:
        PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES['podman-quadlet-volume-unit'],
    });
  }

  for (const artifactUnitFile of artifactUnitFiles) {
    countAreaRuleSignal({
      areasByOwner: podmanOciAreasByOwner,
      entry: artifactUnitFile,
      signal: 'podman-quadlet-artifact-unit',
      score:
        PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES[
          'podman-quadlet-artifact-unit'
        ],
    });
  }

  for (const containerBuildFile of containerBuildFiles) {
    countAreaRuleSignal({
      areasByOwner: podmanOciAreasByOwner,
      entry: containerBuildFile,
      signal: 'oci-container-build-file',
      score:
        PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES['oci-container-build-file'],
    });
  }

  for (const containerIgnoreFile of containerIgnoreFiles) {
    countAreaRuleSignal({
      areasByOwner: podmanOciAreasByOwner,
      entry: containerIgnoreFile,
      signal: 'oci-container-ignore-file',
      score:
        PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES['oci-container-ignore-file'],
    });
  }

  for (const [ownerPath, ownerCandidate] of podmanOciAreasByOwner) {
    if (!hasPodmanOciContainerizationAreaShape(ownerCandidate.countedSignals)) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Containerization',
      evidence: ownerCandidate.evidence,
      path: ownerPath,
      score: ownerCandidate.score,
      primaryTechnology: 'Podman/OCI',
      relatedTechnologies: ['Quadlet'],
    });
  }
}
