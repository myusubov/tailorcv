import type { RepoTreeEntry } from './project-structure-analyzer.types';

/**
 * Programming-language labels inferred from file extensions.
 * Intentionally limited to widely used languages; more are added on demand.
 */
export type DetectedLanguage =
  | 'TypeScript'
  | 'JavaScript'
  | 'Python'
  | 'Java'
  | 'Kotlin'
  | 'C#'
  | 'Go'
  | 'Rust'
  | 'Ruby'
  | 'PHP'
  | 'Swift'
  | 'C'
  | 'C++'
  | 'Dart';

type DetectLanguagesParams = RepoTreeEntry[];

/**
 * Lowercase, dot-stripped file extension to language mapping.
 * Keys must stay lowercase because lookups lowercase the entry extension.
 */
const EXTENSION_LANGUAGE_MAP: Record<string, DetectedLanguage> = {
  ts: 'TypeScript',
  tsx: 'TypeScript',
  mts: 'TypeScript',
  cts: 'TypeScript',
  js: 'JavaScript',
  jsx: 'JavaScript',
  mjs: 'JavaScript',
  cjs: 'JavaScript',
  py: 'Python',
  pyi: 'Python',
  java: 'Java',
  kt: 'Kotlin',
  kts: 'Kotlin',
  cs: 'C#',
  go: 'Go',
  rs: 'Rust',
  rb: 'Ruby',
  rake: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  c: 'C',
  h: 'C',
  cc: 'C++',
  cpp: 'C++',
  cxx: 'C++',
  hpp: 'C++',
  hh: 'C++',
  hxx: 'C++',
  dart: 'Dart',
};

/**
 * Detects which programming languages appear in a repository tree using file
 * extensions only.
 *
 * Inputs: `entries` -- normalized repository tree entries.
 * Output: de-duplicated list of detected languages, sorted by name; empty
 *   when no mapped source files are present.
 * Side effects: none.
 * Limitations: presence-only (no file counts or primary-language ranking);
 *   `.h` is always attributed to C; no vendored or generated directory
 *   exclusion; unmapped extensions are ignored.
 */
export function detectLanguages(
  entries: DetectLanguagesParams,
): DetectedLanguage[] {
  const languages = new Set<DetectedLanguage>();

  for (const entry of entries) {
    if (entry.type !== 'file' || !entry.extension) {
      continue;
    }
    const extensionKey = entry.extension.toLowerCase();
    const languageByExtension = Object.hasOwn(EXTENSION_LANGUAGE_MAP, extensionKey)
      ? EXTENSION_LANGUAGE_MAP[extensionKey]
      : undefined;
    if (languageByExtension) {
      languages.add(languageByExtension);
    }
  }

  return [...languages].sort((a, b) => a.localeCompare(b));
}
