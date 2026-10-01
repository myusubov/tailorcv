import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveManifestDirectoryOwner } from '../owner-adapters';
import { excludingDemoAndTestFolders } from './demo-and-test-folders';

/**
 * Path-only Pulumi signal contract, grounded in the Pulumi project and
 * stack-settings documentation and a GitHub-tree survey of 448 repositories
 * (named Pulumi repos such as pulumi/pulumi, pulumi/examples,
 * pulumi/templates, pulumi/docs and pulumi/pulumi-aws; Pulumi-topic repos,
 * the highest-starred 100 plus a random draw; a random draw of 120 repos
 * returned by code search for `Pulumi.yaml`, `Pulumi.dev.yaml`,
 * `Pulumi.prod.yaml` and `PulumiPolicy.yaml`; and 80 repos found through
 * `@pulumi/pulumi` or `pulumi` in a dependency manifest, which were not
 * selected by the anchor filename). 289 of them emit an area under these
 * rules. Percentages below are shares of those 289:
 * - `pulumi-project-file` (`Pulumi.yaml`): the anchor, scored `3` (the
 *   emission floor), so one file is enough. Pulumi requires the exact name at
 *   every project root, and "the nearest parent folder containing a
 *   `Pulumi.yaml` file determines the current project", so unlike most
 *   detectors in this domain there is a per-unit anchor and it is also the
 *   owner anchor. Only `.yaml` is matched. The `.yml` spelling is valid but
 *   used by 2 of 372 repos with a project file, and paths are lowercased
 *   before matching, so `pulumi.yml` scanner rules and CI workflows cannot be
 *   told from it.
 * - `pulumi-stack-config` (`Pulumi.<stack>.yaml`): support, scored `2` (69%
 *   of repos have one beside a project). Pulumi's own naming for per-stack
 *   settings. It never counts without a project file on the same owner, which
 *   also makes the Pulumi Kubernetes Operator's `pulumi.com_stacks.yaml`
 *   CRDs, which the pattern matches by accident, harmless.
 *
 * Deliberately not scored:
 * - Language entry files (`index.ts`, `__main__.py`, `main.go`,
 *   `Program.cs`): beside a project in 90% of repos, so they add no
 *   information the anchor does not, and the names are generic enough to
 *   match every such file in a repo.
 * - `PulumiPolicy.yaml`: a CrossGuard policy pack is an add-on project, and
 *   17 of the 19 repos with one already emit through a `Pulumi.yaml`.
 * - `.pulumi/`: local state and version files, usually gitignored.
 */
const PULUMI_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES = {
  'pulumi-project-file': 3,
  'pulumi-stack-config': 2,
} as const;

type PulumiInfrastructureAsCodeSignal =
  keyof typeof PULUMI_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES;

/**
 * Matches a counted `Pulumi.yaml`. Shared by the project-file entry schema and
 * the project-directory lookup so both always agree on which files count.
 *
 * Two lookaheads run after the shared demo/test one:
 * - `.github/`: workflow files named `pulumi.yaml`, and test stacks in
 *   pulumi/actions.
 * - Provider stubs: Pulumi provider repositories generate an empty
 *   `Pulumi.yaml` under `sdk/<language>/` and under `provider/cmd`,
 *   `provider/pkg` and `provider/test-programs`. They are anchored at the repo
 *   root and name the language folders, so a bare `sdk` or `provider` folder
 *   in an application repo is not affected. In the survey this removed 48
 *   provider repos and no application repo.
 */
const PULUMI_PROJECT_FILE_REGEX = excludingDemoAndTestFolders(
  String.raw`(?!\.github/)(?!(?:sdk/(?:nodejs|python|go|dotnet|java|jvm|schema)|provider/(?:cmd|pkg|test-programs))/)(?:.*/)?pulumi\.yaml`,
);

/**
 * Adds an `Infrastructure as code` candidate for Pulumi project evidence.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}`
 * map, mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates an `Infrastructure as code` candidate
 * with primary technology `Pulumi` for every owner whose counted signals clear
 * the gate. No related technology is attached: Pulumi is multi-cloud and the
 * target provider is not inferrable from paths. Candidates are keyed per
 * primary technology, so a Terraform candidate on the same owner path is kept
 * beside it.
 *
 * Exclusion: every schema matches on the full path and rejects any path with a
 * whole demo/test directory segment (`excludingDemoAndTestFolders`), at any
 * depth, so files there contribute no signal, score or evidence. The project
 * file additionally rejects `.github/` and provider stubs, see
 * `PULUMI_PROJECT_FILE_REGEX`; the stack-file schema rejects `.github/`.
 *
 * Gate: `pulumi-project-file` alone. Requiring a stack file as well was
 * simulated and rejected: it lost 91 of 289 repos (many projects do not
 * commit stack files) to remove 5 tool repos.
 *
 * Owner: `resolveManifestDirectoryOwner` (`owner-adapters/`, shared with the
 * Helm detector), wired as a plain per-entry `ownerAdapter`. The directory of
 * every counted `Pulumi.yaml` is computed once per call and passed in, so a
 * project's stack files resolve to the same owner as its project file, which
 * the gate depends on. A project nested inside another folds into it, sibling
 * projects collapse into their shared parent directory, and a workspace unit
 * owns every project below it. In the survey this found the project folder in
 * 190 of 191 single-project repos, against 141 for the Terraform folder-name
 * lists.
 *
 * Limitations:
 * - Path-only: the runtime, `main:` entry point and `stackConfigDir` in
 *   `Pulumi.yaml` are not read.
 * - Documentation and test-program corpora under unlisted folder names still
 *   emit (pulumi/docs keeps 444 snippet projects under `static/programs/`),
 *   as do a few tool repos; about 8 of 289 surveyed repos.
 * - Sibling folding is by shared parent only, so unrelated projects side by
 *   side at the repo root fold into `.`.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 * - The contract comes from a search-biased survey tuned and checked on the
 *   same repositories, with no held-out set. A first research pass, like every
 *   other detector in this domain at this stage.
 */
export function addPulumiInfrastructureAsCodeAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  // Directory of every counted Pulumi.yaml; a root project has no parent path,
  // so it maps to the repo root, `.`.
  const projectDirectories = index
    .findEntriesByPathMatching({ pattern: PULUMI_PROJECT_FILE_REGEX })
    .map((entry) => entry.parentPath ?? '.');

  applyDeclarativeAreaDetector<PulumiInfrastructureAsCodeSignal>({
    candidates,
    index,
    detectedArea: 'Infrastructure as code',
    primaryTech: 'Pulumi',
    signalScores: PULUMI_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'pulumi-project-file',
        regex: PULUMI_PROJECT_FILE_REGEX,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'pulumi-stack-config',
        regex: excludingDemoAndTestFolders(
          String.raw`(?!\.github/)(?:.*/)?pulumi\.[^/]+\.yaml`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'pulumi-project-file',
        },
      },
    },
    ownerAdapter: ({ path }) =>
      resolveManifestDirectoryOwner({
        path,
        manifestDirectories: projectDirectories,
      }),
  });
}
