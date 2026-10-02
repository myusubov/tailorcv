import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { normalizePath } from '../../project-structure-path-utils';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveManifestDirectoryOwner } from '../owner-adapters';
import { excludingDemoAndTestFolders } from './demo-and-test-folders';

/**
 * Path-only Ansible signal contract, grounded in the Ansible documentation
 * (sample setup, roles, collection structure, configuration, inventory,
 * ansible-lint configuration) and a GitHub-tree survey of 876 repositories:
 * 67 named repos (ansible/*, kubespray, AWX, geerlingguy roles,
 * ansible-collections/*), 268 from the `ansible`, `ansible-role`,
 * `ansible-playbook` and `ansible-collection` topics, 40 `homelab` repos,
 * 273 returned by code search for Ansible file names, 40 found through
 * `ansible` in a `requirements.txt`, and 188 repos from unrelated topics
 * (Rails, Django, Spring Boot, React, Terraform, ...) as the false-positive
 * check. 515 of them emit an area under these rules. Percentages below are
 * shares of those 515:
 * - Anchors, scored `3` (the emission floor), so one is enough. Ansible has no
 *   single file every project has, so the anchor is a set of four names that
 *   only Ansible uses:
 *   - `ansible-config-file` (`ansible.cfg`, 53%): Ansible's own config, found
 *     by searching the current directory, so it marks a project root.
 *   - `ansible-role-tasks` (`tasks/main.yml`, 79%): the main file of a role,
 *     whether under `roles/<name>/` or a standalone role repository.
 *   - `ansible-variable-directory` (`group_vars/`, `host_vars/`, 42%):
 *     directory names only Ansible inventories use.
 *   - `ansible-collection-manifest` (`galaxy.yml`, 20%): the documented
 *     required file at a collection root.
 *   None of the four appeared in the 188 unrelated-topic repos except through
 *   one real Ansible repository.
 * - Support signals, which raise confidence and never open the gate:
 *   - `ansible-lint-config` (`.ansible-lint`, 39%) and
 *     `ansible-molecule-scenario` (`molecule/<scenario>/molecule.yml`, 26%)
 *     score `2`. Both are Ansible-only, but a repo with only these is tooling
 *     around Ansible, not a project.
 *   - `ansible-role-companion` (`handlers|defaults|meta|vars/main.yml`, 73%)
 *     and `ansible-playbook-file` (`site.yml`, `playbook.yml`,
 *     `playbooks/*.yml`, 46%) score `1`. Both are common names outside
 *     Ansible (Antora's `playbooks/site.yml`), so each adds one point.
 *
 * Deliberately not scored:
 * - `inventory/`, `hosts`, `hosts.ini`: generic in application code, and
 *   collections' `plugins/inventory/` matches. It never decided emission.
 * - `roles/` alone: 3% of unrelated repos have one (permission controllers).
 *   It is not a signal; `roles/<name>/tasks/main.yml` is.
 * - `requirements.yml`, `*.j2`, vault files: generic names shared with other
 *   tools.
 * - `execution-environment.yml`: it builds container images, and where it was
 *   the only anchor the folder was a demo or image build.
 */
const ANSIBLE_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES = {
  'ansible-config-file': 3,
  'ansible-role-tasks': 3,
  'ansible-variable-directory': 3,
  'ansible-collection-manifest': 3,
  'ansible-lint-config': 2,
  'ansible-molecule-scenario': 2,
  'ansible-role-companion': 1,
  'ansible-playbook-file': 1,
} as const;

type AnsibleInfrastructureAsCodeSignal =
  keyof typeof ANSIBLE_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES;

/**
 * Matches an `ansible.cfg` that marks a project root. Shared by the
 * `ansible-config-file` schema and the manifest-directory derivation so the
 * two cannot disagree about which config files count. A path with an `etc/`
 * segment at any depth is rejected: `/etc/ansible/ansible.cfg` is Ansible's
 * documented system-wide fallback, so a copy of it (a container's root
 * filesystem overlay, a role's `files/etc/ansible/`) configures a machine,
 * not a project.
 */
const ANSIBLE_CONFIG_FILE_REGEX = excludingDemoAndTestFolders(
  String.raw`(?!\.github/)(?!(?:.*/)?etc/)(?:.*/)?ansible\.cfg`,
);

/**
 * Matches the main task file of a role (`tasks/main.yml` or `.yaml`). Shared by
 * the `ansible-role-tasks` schema and the manifest-directory derivation so the
 * two cannot disagree about which role task files count.
 */
const ANSIBLE_ROLE_TASKS_REGEX = excludingDemoAndTestFolders(
  String.raw`(?!\.github/)(?:.*/)?tasks/main\.ya?ml`,
);

/**
 * Matches anything inside a `group_vars/` or `host_vars/` directory. Shared by
 * the `ansible-variable-directory` schema and the manifest-directory
 * derivation so the two cannot disagree about which variable files count. The
 * directory entry itself does not match (`.+` needs a character after the
 * slash); its files and subfolders do, so one directory yields one entry per
 * file.
 */
const ANSIBLE_VARIABLE_DIRECTORY_REGEX = excludingDemoAndTestFolders(
  String.raw`(?!\.github/)(?:.*/)?(?:group_vars|host_vars)/.+`,
);

/**
 * Matches the `galaxy.yml` that sits at a collection root. Shared by the
 * `ansible-collection-manifest` schema and the manifest-directory derivation
 * so the two cannot disagree about which collection manifests count. The match
 * runs on the lowercased path, so it would also match the uppercase
 * `GALAXY.yml` that `ansible-galaxy install` writes into an installed
 * collection's `<name>-<version>.info` folder. That file is install metadata,
 * not a collection root, so a `galaxy.yml` whose parent folder ends in `.info`
 * is rejected.
 */
const ANSIBLE_COLLECTION_MANIFEST_REGEX = excludingDemoAndTestFolders(
  String.raw`(?!\.github/)(?!(?:.*/)?[^/]*\.info/galaxy\.yml)(?:.*/)?galaxy\.yml`,
);

/**
 * Joins the segments of `path` before `endIndex` into a directory path.
 *
 * Inputs: `path` (kept in its original case) and `endIndex`, the index of the
 * first segment to leave out.
 * Output: the joined directory, or `.` when no segment is left (the project
 * sits at the repo root).
 * Side effects: none.
 */
function directoryBefore({
  path,
  endIndex,
}: {
  path: string;
  endIndex: number;
}): string {
  return path.split('/').slice(0, endIndex).join('/') || '.';
}

/**
 * Returns the index of the first segment that equals any of `names`, or `-1`
 * when none does. Compares whole segments, so `my-roles` is not `roles`.
 * Callers pass lowercased segments, since `names` are lowercase.
 */
function firstIndexOf({
  parts,
  names,
}: {
  parts: string[];
  names: string[];
}): number {
  return parts.findIndex((part) => names.includes(part));
}

/**
 * Derives the Ansible project directories of a repository from the paths of
 * its anchor files, for `resolveManifestDirectoryOwner`.
 *
 * Unlike Helm's `Chart.yaml` or Pulumi's `Pulumi.yaml`, Ansible has no single
 * file whose folder is the project, so the folder is derived per anchor:
 * - `ansible.cfg` and `galaxy.yml`: the folder that holds the file.
 * - `tasks/main.yml`: the folder above the first `roles/` segment, so every
 *   role (vendored and nested ones included) belongs to the project that holds
 *   it. Without a `roles/` segment it is a standalone role, and the folder
 *   above `tasks/`.
 * - `group_vars/` and `host_vars/`: the folder above the earliest of the first
 *   `roles/` segment, the first `inventory`/`inventories` segment and the
 *   variables folder itself. Cutting at `inventory` also drops an environment
 *   folder below it (`inventory/<env>/group_vars/`).
 *
 * Inputs: `index`, the repository path lookup.
 * Output: the distinct project directories, `.` for the repo root. They keep
 * the original case of the tree: the engine hands the owner adapter
 * original-case paths and the resolver compares them case-sensitively, while
 * segment names are matched on a lowercased copy.
 * Side effects: none. Called once per repository by the detector so the owner
 * adapter stays a pure function of its inputs.
 * Invariants: reuses the entry-schema regex constants, so demo/test,
 * `.github/`, `etc/` and `*.info` paths never contribute a directory.
 * Limitations: path-only. `molecule/` is not used (in the survey it would have
 * added a directory for only 5 paths in 4 of the 133 repos with a molecule
 * scenario). A project that sits inside a folder literally named `inventory`
 * is cut to that folder's parent.
 */
const deriveManifestDirectories = (
  index: DetectedAreaRuleContext['index'],
): string[] => {
  const manifestDirectories = new Set<string>();

  const ansibleConfigEntries = index.findEntriesByPathMatching({
    pattern: ANSIBLE_CONFIG_FILE_REGEX,
  });
  const ansibleRoleTasksEntries = index.findEntriesByPathMatching({
    pattern: ANSIBLE_ROLE_TASKS_REGEX,
  });
  const ansibleVariableDirectoryEntries = index.findEntriesByPathMatching({
    pattern: ANSIBLE_VARIABLE_DIRECTORY_REGEX,
  });
  const ansibleCollectionManifestEntries = index.findEntriesByPathMatching({
    pattern: ANSIBLE_COLLECTION_MANIFEST_REGEX,
  });

  for (const { parentPath } of [
    ...ansibleCollectionManifestEntries,
    ...ansibleConfigEntries,
  ]) {
    manifestDirectories.add(parentPath ?? '.');
  }

  for (const { path } of ansibleRoleTasksEntries) {
    const normalizedParts = normalizePath({ path }).split('/');
    const rolesIndex = firstIndexOf({
      parts: normalizedParts,
      names: ['roles'],
    });

    // The schema guarantees the path ends in `tasks/main.yml`, so `tasks` is
    // always second to last: a standalone role is the folder above it.
    const projectEndIndex =
      rolesIndex !== -1 ? rolesIndex : normalizedParts.length - 2;

    manifestDirectories.add(
      directoryBefore({ path, endIndex: projectEndIndex }),
    );
  }

  for (const { path } of ansibleVariableDirectoryEntries) {
    const normalizedParts = normalizePath({ path }).split('/');
    const rolesIndex = firstIndexOf({
      parts: normalizedParts,
      names: ['roles'],
    });
    const inventoryIndex = firstIndexOf({
      parts: normalizedParts,
      names: ['inventory', 'inventories'],
    });
    // Never -1: the schema guarantees a `group_vars` or `host_vars` segment.
    const variablesIndex = firstIndexOf({
      parts: normalizedParts,
      names: ['group_vars', 'host_vars'],
    });

    // The project ends at the earliest marker that exists. A missing marker
    // (-1) is dropped, and a marker after the variables folder cannot win
    // because `variablesIndex` is always in the comparison.
    const projectEndIndex = Math.min(
      variablesIndex,
      ...[rolesIndex, inventoryIndex].filter((i) => i !== -1),
    );

    manifestDirectories.add(
      directoryBefore({ path, endIndex: projectEndIndex }),
    );
  }

  return Array.from(manifestDirectories);
};

/**
 * Adds an `Infrastructure as code` candidate for Ansible project evidence.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}`
 * map, mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates an `Infrastructure as code` candidate
 * with primary technology `Ansible` for every owner whose counted signals
 * clear the gate. No related technology is attached: Ansible is not tied to
 * one cloud or platform. Candidates are keyed per primary technology, so a
 * Terraform, Helm, Bicep or Pulumi candidate on the same owner path is kept
 * beside it.
 *
 * Exclusion: every schema matches on the full path and rejects any path with a
 * whole demo/test directory segment (`excludingDemoAndTestFolders`), at any
 * depth, so files there contribute no signal, score or evidence. This matters
 * for Ansible: `ansible-galaxy init` roles ship a `tests/` folder and
 * collections ship hundreds of test targets. Every schema also rejects
 * `.github/`; `ansible-config-file` also rejects an `etc/` segment, and
 * `ansible-collection-manifest` rejects a `galaxy.yml` inside a `*.info`
 * folder (see their constants).
 *
 * Gate: `hasOneOf` the four anchors. The anchors are exclusive names, like
 * Terraform's, so a plain OR fits. Requiring two anchors was simulated and
 * rejected: it lost 204 of 515 repos, mostly small role repos that have only
 * `tasks/` and `defaults/`. The weak signals cannot reach the floor of 3 on
 * their own in nearly every repository, so the gate is cheap insurance.
 *
 * Owner: `resolveManifestDirectoryOwner` (`owner-adapters/`, shared with the
 * Helm and Pulumi detectors), wired as a per-entry `ownerAdapter`, with the
 * project directories derived once per call by `deriveManifestDirectories`.
 * Every file resolves to the project that holds it, nested roles and projects
 * fold into the enclosing one, and sibling projects collapse into their shared
 * parent. This matters because 121 of 515 surveyed emitting repos keep Ansible
 * in a subfolder (97 of them in a folder named `ansible`), and the engine's
 * default resolver puts nearly all of them at `.`. A survey simulation of an
 * earlier variant of this derivation (it also used `molecule/`) found the
 * folder of the lone `ansible.cfg` in 215 of 223 single-config repos against
 * 166 for the default; that comparison is partly circular, since the
 * derivation and the check come from the same survey.
 *
 * Limitations:
 * - Path-only: `ansible.cfg` settings, playbook contents and `requirements.yml`
 *   are not read.
 * - Repositories made only of free-form playbooks (`security.yml`,
 *   `install-package.yml`) have no path signal and emit nothing. Recall was
 *   49 of 51 on role and collection repos and 14 of 23 on `ansible-playbook`
 *   topic repos.
 * - Ansible tool repositories (ansible-lint, molecule, AWX, galaxy_ng) emit,
 *   because they ship real roles and config; "uses Ansible" cannot be told
 *   from "is about Ansible".
 * - Sibling folding is by shared parent only, so unrelated projects side by
 *   side fold together, and course or lab repositories with one project per
 *   exercise can produce many areas.
 * - The derivation does not use `molecule/`, and a project inside a folder
 *   literally named `inventory` is cut to that folder's parent (see
 *   `deriveManifestDirectories`).
 * - An `ansible.cfg` under any `etc/` folder is rejected as system config. No
 *   surveyed repository had one, so the rule is untested against real data,
 *   and it would also drop a real project config kept in a folder named `etc`.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical.
 * - The contract comes from a search-biased survey tuned and checked on the
 *   same repositories, with no held-out set. A first research pass, like every
 *   other detector in this domain at this stage.
 */
export function addAnsibleInfrastructureAsCodeAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const manifestDirectories = deriveManifestDirectories(index);

  applyDeclarativeAreaDetector<AnsibleInfrastructureAsCodeSignal>({
    candidates,
    index,
    detectedArea: 'Infrastructure as code',
    primaryTech: 'Ansible',
    signalScores: ANSIBLE_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'ansible-config-file',
        regex: ANSIBLE_CONFIG_FILE_REGEX,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ansible-role-tasks',
        regex: ANSIBLE_ROLE_TASKS_REGEX,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ansible-variable-directory',
        regex: ANSIBLE_VARIABLE_DIRECTORY_REGEX,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ansible-collection-manifest',
        regex: ANSIBLE_COLLECTION_MANIFEST_REGEX,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ansible-lint-config',
        regex: excludingDemoAndTestFolders(
          String.raw`(?!\.github/)(?:(?:.*/)?\.ansible-lint(?:\.ya?ml)?|\.config/ansible-lint\.ya?ml)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ansible-molecule-scenario',
        regex: excludingDemoAndTestFolders(
          String.raw`(?!\.github/)(?:.*/)?molecule/[^/]+/molecule\.ya?ml`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ansible-role-companion',
        regex: excludingDemoAndTestFolders(
          String.raw`(?!\.github/)(?:.*/)?(?:handlers|defaults|meta|vars)/main\.ya?ml`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ansible-playbook-file',
        regex: excludingDemoAndTestFolders(
          String.raw`(?!\.github/)(?:(?:.*/)?(?:site|playbook)\.ya?ml|(?:.*/)?playbooks?/[^/]+\.ya?ml)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: [
            'ansible-config-file',
            'ansible-role-tasks',
            'ansible-variable-directory',
            'ansible-collection-manifest',
          ],
        },
      },
    },
    ownerAdapter: ({ path }) =>
      resolveManifestDirectoryOwner({ path, manifestDirectories }),
  });
}
