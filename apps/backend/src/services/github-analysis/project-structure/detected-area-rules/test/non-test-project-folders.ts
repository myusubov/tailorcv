// Directory names (regex fragments) whose test-runner configs are examples,
// fixtures, templates or vendored copies. Test folders are deliberately absent:
// for a test-suite detector they are the evidence, and real projects live in
// them.
const NON_TEST_PROJECT_FOLDERS = [
  'examples?',
  'demos?',
  'testdata',
  'fixtures',
  '__fixtures__',
  'templates?',
  'starters?',
  'samples?',
  'playground',
  'sandbox',
  'vendor',
  'third_party',
  '3rdparty',
  'external',
  'extern',
  'node_modules',
  'site-packages',
] as const;

type NonTestProjectFolder = (typeof NON_TEST_PROJECT_FOLDERS)[number];

/**
 * Creates a builder that turns a path-regex fragment into an anchored regex
 * rejecting the shared folder list, adjusted per detector.
 *
 * `extraFolders` adds regex fragments for names only this detector rejects.
 * `allowedFolders` removes shared entries by their exact name. A name only
 * counts as a whole directory segment, so `my-examples/` is not excluded. Input
 * paths are already lowercased by `normalizePath`, so the regex needs no case
 * flag.
 */
export function createNonTestProjectFoldersExcluder({
  extraFolders = [],
  allowedFolders = [],
}: {
  extraFolders?: readonly string[];
  allowedFolders?: readonly NonTestProjectFolder[];
}): (pattern: string) => RegExp {
  const folders = [
    ...NON_TEST_PROJECT_FOLDERS.filter(
      (folder) => !allowedFolders.includes(folder),
    ),
    ...extraFolders,
  ].join('|');
  return (pattern) => new RegExp(`^(?!(?:.*/)?(?:${folders})/)${pattern}$`);
}

/** Builds the path regex for detectors that adjust nothing in the shared list. */
export const excludingNonTestProjectFolders =
  createNonTestProjectFoldersExcluder({});
