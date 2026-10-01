import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveBicepRootOwner } from '../owner-adapters/resolve-bicep-root-owner';
import { excludingDemoAndTestFolders } from './demo-and-test-folders';

/**
 * Path-only Azure Bicep signal contract, grounded in the Bicep and Azure
 * Developer CLI documentation and a GitHub-tree survey of 226 repositories
 * (26 named repos such as Azure/bicep-registry-modules,
 * Azure-Samples/azd-starter-bicep, Azure/ALZ-Bicep,
 * Azure/azure-quickstart-templates, Azure/bicep and Azure/azure-dev; a random
 * sample of 130 drawn from GitHub's `language:Bicep` ranking and from code
 * search for `main.bicep`, `*.bicepparam`, `bicepconfig.json` and
 * `azure.yaml`; and a 70-repo `azure.yaml` negative control). Percentages
 * below are shares of the 127 sampled repos that contain a counted `.bicep`
 * file:
 * - `bicep-source-file` (`*.bicep`): the anchor, scored `3` (the emission
 *   floor), so one file is enough. The extension belongs to Bicep alone and no
 *   other tool used it in the survey. The stem must be at least one character
 *   (`[^/]+`) because the entry index also matches directories, and
 *   Azure/ResourceModules contains a directory literally named `.bicep`.
 * - `bicep-parameters-file` (`*.bicepparam`): support, `2`. Bicep's own
 *   parameter format (24% of repos): rare because JSON parameter files are
 *   still common, but strong when present.
 * - `bicep-entry-point` (`main.bicep`): support, `1` (83%). The conventional
 *   deployable template in azd, Azure quickstarts and Azure Verified Modules.
 *   A `main.bicep` also counts as a `bicep-source-file`, so a lone root
 *   template scores `4`; each signal is still counted once per owner.
 * - `bicep-config-file` (`bicepconfig.json`): support, `1` (24%). Exclusive to
 *   Bicep tooling.
 * - `bicep-parameter-values` (`main.parameters.json`): support, `1` (39%). The
 *   azd convention beside `infra/main.bicep`.
 *
 * Deliberately not scored:
 * - `azure.yaml`: 17 of the 70 negative-control repos have one and no `.bicep`
 *   (azd with Terraform, azd without infrastructure, other tools), and it sits
 *   at the repo root while the templates sit in `infra/`, so it would resolve
 *   to a different owner than the templates anyway.
 * - Other `*.parameters.json`, `main.json`, `azuredeploy.json`,
 *   `metadata.json`: ARM and registry conventions that ARM-only repositories
 *   share.
 */
const BICEP_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES = {
  'bicep-source-file': 3,
  'bicep-parameters-file': 2,
  'bicep-entry-point': 1,
  'bicep-config-file': 1,
  'bicep-parameter-values': 1,
} as const;

type BicepInfrastructureAsCodeSignal =
  keyof typeof BICEP_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES;

/**
 * Adds an `Infrastructure as code` candidate for Azure Bicep evidence.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}`
 * map, mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates an `Infrastructure as code` candidate
 * with primary technology `Bicep` and related technology `Azure` for every
 * owner whose counted signals clear the gate. Candidates are keyed per primary
 * technology, so a Terraform candidate on the same owner path is kept beside
 * it.
 *
 * Exclusion: every schema matches on the full path and rejects any path with a
 * whole demo/test directory segment (`excludingDemoAndTestFolders`), at any
 * depth, so files there contribute no signal, score or evidence. This matters
 * for Bicep: Azure/bicep-registry-modules keeps 1,546 of its 2,375 `.bicep`
 * files under `tests/`.
 *
 * Gate: `bicep-source-file` alone. Support signals only add confidence. A
 * stricter anchor-plus-support gate was simulated and rejected: it dropped 17
 * of 148 real Bicep repos (module and template collections with no support
 * file) and removed none of the false positives, because tool and fixture
 * repos carry support files of their own.
 *
 * Owner: `resolveBicepRootOwner`, wired with a `rootHasBicep` flag computed
 * once per repo (a `.bicep` file directly at the repo root). When the root has
 * one, it owns every Bicep path in the repo. Otherwise a home folder (`bicep`,
 * `infra`, `infrastructure`, `iac`, `deploy`, ...) or environment folder owns
 * what is below it, `modules/` collapses into the enclosing owner, and a
 * workspace unit (`apps/<name>`) keeps its own Bicep. The generic resolver is
 * not used because it turns `modules/vm.bicep` into the owner
 * `modules/vm.bicep`.
 *
 * Limitations:
 * - Path-only: it cannot tell what a template deploys.
 * - A module folder named `deployment` (or a `src` segment) inside a module
 *   registry becomes a stray owner, and a project folder with an unlisted name
 *   falls back to `.`.
 * - Bicep compiler and tool repos keep fixtures under names no list catches
 *   (`Files/baselines`, `SnippetTemplates`), so about 5 of 156 surveyed repos
 *   still emit one area.
 * - The contract comes from a search-biased survey tuned and checked on the
 *   same repositories, with no held-out set. A first research pass, like every
 *   other detector in this domain at this stage.
 */
export function addBicepInfrastructureAsCodeAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  // Computed once here rather than in the adapter, which runs for every
  // matched file. Only a `.bicep` file directly at the repo root counts.
  const rootHasBicep = index.hasPathMatching({ pattern: /^[^/]+\.bicep$/ });

  applyDeclarativeAreaDetector<BicepInfrastructureAsCodeSignal>({
    candidates,
    index,
    detectedArea: 'Infrastructure as code',
    primaryTech: 'Bicep',
    relatedTechs: ['Azure'],
    signalScores: BICEP_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'bicep-source-file',
        regex: excludingDemoAndTestFolders(String.raw`(?:.*/)?[^/]+\.bicep`),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'bicep-parameters-file',
        regex: excludingDemoAndTestFolders(
          String.raw`(?:.*/)?[^/]+\.bicepparam`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'bicep-entry-point',
        regex: excludingDemoAndTestFolders(String.raw`(?:.*/)?main\.bicep`),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'bicep-config-file',
        regex: excludingDemoAndTestFolders(
          String.raw`(?:.*/)?bicepconfig\.json`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'bicep-parameter-values',
        regex: excludingDemoAndTestFolders(
          String.raw`(?:.*/)?main\.parameters\.json`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'bicep-source-file',
        },
      },
    },
    ownerAdapter: ({ path }) =>
      resolveBicepRootOwner({ path, rootHasBicep }),
  });
}
