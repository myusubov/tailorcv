import type {
  RepoTreeEntry,
  RootManifest,
  RootManifestEcosystem,
} from './project-structure-analyzer.types';

type DetectRootManifestsParams = RepoTreeEntry[];

/**
 * Lowercase manifest filename to dependency ecosystem mapping.
 * Keys must stay lowercase because lookups lowercase the entry name.
 */
const MANIFEST_FILE_ECOSYSTEM: Record<string, RootManifestEcosystem> = {
  'package.json': 'Node.js',
  'pyproject.toml': 'Python',
  'requirements.txt': 'Python',
  pipfile: 'Python',
  'setup.py': 'Python',
  'go.mod': 'Go',
  'cargo.toml': 'Rust',
  'pom.xml': 'Java/Kotlin',
  'build.gradle': 'Java/Kotlin',
  'build.gradle.kts': 'Java/Kotlin',
  gemfile: 'Ruby',
  'composer.json': 'PHP',
};

/**
 * Lists dependency manifests present at the repository root (depth 0).
 *
 * Inputs: `entries` -- normalized repository tree entries.
 * Output: manifests sorted by filename; empty when the root has no recognized
 *   manifest.
 * Side effects: none.
 * Limitations: path-only (contents are never read); root scope only, so
 *   per-package manifests inside a monorepo are out of scope; unmapped
 *   manifest filenames are ignored.
 */
export function detectRootManifests(
  entries: DetectRootManifestsParams,
): RootManifest[] {
  const manifests: RootManifest[] = [];

  for (const entry of entries) {
    if (entry.type !== 'file' || entry.depth !== 0) {
      continue;
    }

    const manifestKey = entry.name.toLowerCase();
    const ecosystem = MANIFEST_FILE_ECOSYSTEM[manifestKey];
    if (!ecosystem) {
      continue;
    }

    manifests.push({ file: entry.name, ecosystem });
  }

  return manifests.sort((a, b) => a.file.localeCompare(b.file));
}
