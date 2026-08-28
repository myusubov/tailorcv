import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Defines the path-only Podman/OCI signal contract used for owner-scoped
 * scoring and conservative combination-based emission.
 *
 * @remarks Basename matching cannot validate Quadlet file sections, so no
 * individual extension is treated as independently decisive. Core runtime and
 * build units receive more weight than support resources, while the gate
 * requires a coherent multi-signal shape.
 */
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
} as const;

type PodmanOciContainerizationSignal =
  keyof typeof PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES;

/**
 * Detects owner-scoped Podman/OCI containerization areas from coherent groups
 * of Quadlet and OCI build paths.
 *
 * @remarks No basename-only signal can emit independently because extensions
 * such as `.container` and `.build` can collide with unrelated file formats.
 * A runtime unit (`.container`/`.pod`/`.kube`) needs an independent
 * companion -- another runtime unit, a build/image/network/volume/artifact
 * unit, or a generic OCI build file. A build unit needs a build/image or
 * runtime companion. Image, network, volume, artifact, and
 * `.containerignore` signals remain support-only and never unlock emission
 * alone or together. Quadlet and generic OCI build signals can appear at
 * repo root or in many configuration folders, so matching uses file
 * basenames without a required directory; owners are resolved through the
 * shared `ownerPathForApplicationArea` default.
 */
export function addPodmanOciContainerizationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<PodmanOciContainerizationSignal>({
    candidates,
    index,
    detectedArea: 'Containerization',
    primaryTech: 'Podman/OCI',
    relatedTechs: ['Quadlet'],
    signalScores: PODMAN_OCI_CONTAINERIZATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'podman-quadlet-container-unit',
        regex: /^.+\.container$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'podman-quadlet-pod-unit',
        regex: /^.+\.pod$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'podman-quadlet-kube-unit',
        regex: /^.+\.kube$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'podman-quadlet-build-unit',
        regex: /^.+\.build$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'podman-quadlet-image-unit',
        regex: /^.+\.image$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'podman-quadlet-network-unit',
        regex: /^.+\.network$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'podman-quadlet-volume-unit',
        regex: /^.+\.volume$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'podman-quadlet-artifact-unit',
        regex: /^.+\.artifact$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'oci-container-build-file',
        regex: /^containerfile(?:\.[^/]+)?$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'oci-container-ignore-file',
        regex: /^\.containerignore$/,
        indexMethod: 'findFilesByNameMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              // hasRuntimeDefinition (container/pod/kube) AND hasRuntimeCompanion
              hasOneOf: [
                'podman-quadlet-container-unit',
                'podman-quadlet-pod-unit',
                'podman-quadlet-kube-unit',
              ],
              or: [
                {
                  has: 'podman-quadlet-container-unit',
                  or: [
                    { has: 'podman-quadlet-pod-unit' },
                    { has: 'podman-quadlet-kube-unit' },
                  ],
                },
                {
                  hasAllOf: ['podman-quadlet-pod-unit', 'podman-quadlet-kube-unit'],
                },
                { has: 'podman-quadlet-build-unit' },
                { has: 'podman-quadlet-image-unit' },
                { has: 'podman-quadlet-network-unit' },
                { has: 'podman-quadlet-volume-unit' },
                { has: 'podman-quadlet-artifact-unit' },
                { has: 'oci-container-build-file' },
              ],
            },
            {
              // hasBuildShape: build unit AND a build/image/runtime companion
              has: 'podman-quadlet-build-unit',
              or: [
                { has: 'oci-container-build-file' },
                { has: 'podman-quadlet-container-unit' },
                { has: 'podman-quadlet-pod-unit' },
                { has: 'podman-quadlet-kube-unit' },
                { has: 'podman-quadlet-image-unit' },
              ],
            },
          ],
        },
      },
    },
  });
}
