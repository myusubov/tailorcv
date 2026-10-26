import type {
  CandidateFileToInspect,
  DetectedProjectArea,
  RepoTreeEntry,
} from './project-structure-analyzer.types';
import { buildEntryIndex } from './project-structure-entry-index';

// Tier one file names, matched lowercased. README may be extensionless or use
// md/rst/txt/adoc; an extra dotted part (README.zh.md) is deliberately not
// matched, so translations are skipped. AGENTS and CLAUDE are markdown only.
const TIER_ONE_FILE_NAME_PATTERN =
  /^(readme(\.(md|rst|txt|adoc))?|agents\.md|claude\.md|(architecture|design)\.(md|mdx|rst))$/;

// Tier three paths, lowercased: an index-style file at any depth in a root docs
// folder (`docs/docs/developer/architecture.mdx`), or ARCHITECTURE/DESIGN below
// the root, as tier one has it. Dot-folders, templates, examples, fixtures and tests are skipped.
const TIER_THREE_PATH_PATTERN =
  /^(?!(.*\/)?(\.[^/]+|_?templates?|examples?|fixtures?|tests?)\/)(?:(docs|doc|documentation|dev-docs|wiki|design|specs|rfcs|adr)\/(.*\/)?(readme|index|overview|introduction|architecture|design)\.(md|mdx|rst|adoc)|.*\/(architecture|design)\.(md|mdx|rst))$/;
// Tier three sort group: ARCHITECTURE or DESIGN file names rank ahead of other
// docs files. Tested on the original-case name, hence the `i` flag. The file name
// is matched, not the folder, so `design/index.md` does not count.
const ARCHITECTURE_OR_DESIGN_FILE_PATTERN =
  /(^|\/)(architecture|design)\.(md|mdx|rst|adoc)$/i;

// Tier two file types in sort order: schema files, then model/entity and
// controller files (they name the domain and its features), then frontend layout
// and page files. Sorting tests the original-case `entry.name`, hence the `i` flag.
const TIER_TWO_SCHEMA_FILE_PATTERN = /^(schema\.(prisma|rb)|models\.py)$/i;
const TIER_TWO_MODEL_FILE_PATTERN = /^[\w-]+\.(model|entity)\.(ts|js)$/i;
const TIER_TWO_CONTROLLER_FILE_PATTERN = /^[\w-]+\.controller\.(ts|js)$/i;
const TIER_TWO_LAYOUT_FILE_PATTERN = /^layout\.(tsx|jsx|ts|js)$/i;
const TIER_TWO_PAGE_FILE_PATTERN = /^page\.(tsx|jsx|ts|js)$/i;

// Tier two file types, highest priority first. The sort ranks a file by its
// position here, so adding a type only needs a new entry in the right place.
const TIER_TWO_FILE_PATTERNS_BY_PRIORITY = [
  TIER_TWO_SCHEMA_FILE_PATTERN,
  TIER_TWO_MODEL_FILE_PATTERN,
  TIER_TWO_CONTROLLER_FILE_PATTERN,
  TIER_TWO_LAYOUT_FILE_PATTERN,
  TIER_TWO_PAGE_FILE_PATTERN,
];

// Any tier two file type. The index lowercases names, so the combined pattern
// needs no case flag.
const TIER_TWO_FILE_NAME_PATTERN = new RegExp(
  TIER_TWO_FILE_PATTERNS_BY_PRIORITY.map((pattern) => pattern.source).join('|'),
);

// Tier two files each detected area keeps before the overall cap applies.
const TIER_TWO_PER_AREA_CAP = 5;

// Overall tier two cap. Each area already keeps its own top files, so without
// this the total grows with the number of distinct area paths.
const TIER_TWO_TOTAL_CAP = 10;

// Overall tier three cap, applied after the sort so architecture and design
// files are kept ahead of the other docs files.
const TIER_THREE_TOTAL_CAP = 5;

// Larger files are skipped, and so are empty or size-less ones.
const MAX_CANDIDATE_FILE_BYTES = 100 * 1024;

const isWithinSizeLimit = (size: number | null) =>
  !!size && size <= MAX_CANDIDATE_FILE_BYTES;

// Shallowest first, then path so the order is the same every run.
const compareByDepthThenPath = (a: RepoTreeEntry, b: RepoTreeEntry): number => {
  if (a.depth !== b.depth) return a.depth - b.depth;
  return a.path.localeCompare(b.path);
};

// Position of the first matching tier two type; a name that matches none ranks
// after every type.
const getTierTwoRank = (name: string): number => {
  const rank = TIER_TWO_FILE_PATTERNS_BY_PRIORITY.findIndex((pattern) =>
    pattern.test(name),
  );
  return rank === -1 ? TIER_TWO_FILE_PATTERNS_BY_PRIORITY.length : rank;
};

const sortTierTwoFiles = (a: RepoTreeEntry, b: RepoTreeEntry): number => {
  const rankDifference = getTierTwoRank(a.name) - getTierTwoRank(b.name);
  if (rankDifference !== 0) return rankDifference;

  return compareByDepthThenPath(a, b);
};

/**
 * Returns the file paths a later step should read to understand what the repository does.
 * Order is root docs files, then up to `TIER_TWO_TOTAL_CAP` schema, model, controller, layout and
 * page files across detected areas, then up to `TIER_THREE_TOTAL_CAP` docs files. Areas run
 * deepest first, root last, and each skips files an earlier area already took.
 */
export function buildCandidateFilesToInspect({
  entries,
  detectedAreas,
}: {
  entries: RepoTreeEntry[];
  detectedAreas: DetectedProjectArea[];
}): CandidateFileToInspect[] {
  const index = buildEntryIndex(entries);
  // Deepest paths run first, root last: a child must claim its own files before
  // its parent, which contains them, runs. Equal depths do not overlap, so the
  // alphabetical order only keeps the result the same every run.
  const dedupedDetectedAreaPaths = [
    ...new Set(detectedAreas.map((area) => area.path)),
  ].sort((a, b) => {
    if (a === '.') return 1;
    if (b === '.') return -1;

    const aSegmentCount = a.split('/').length;
    const bSegmentCount = b.split('/').length;

    if (aSegmentCount !== bSegmentCount) return bSegmentCount - aSegmentCount;
    return a.localeCompare(b);
  });

  const tierOneFiles = index
    .findFilesByNameMatching({ pattern: TIER_ONE_FILE_NAME_PATTERN })
    .filter(
      (entry) =>
        entry.parentPath === null && isWithinSizeLimit(entry.sizeBytes),
    );

  // The search does not depend on the area, so it runs once, not per path.
  const tierTwoCandidates = index
    .findFilesByNameMatching({ pattern: TIER_TWO_FILE_NAME_PATTERN })
    .filter((entry) => isWithinSizeLimit(entry.sizeBytes));

  const tierTwoFiles: RepoTreeEntry[] = [];
  const claimedTierTwoPaths = new Set<string>();

  for (const detectedAreaPath of dedupedDetectedAreaPaths) {
    const areaFiles = tierTwoCandidates
      .filter(
        (entry) =>
          (detectedAreaPath === '.' ||
            entry.path.startsWith(`${detectedAreaPath}/`)) &&
          // Deeper areas run first, so an area never takes a file a deeper
          // area (or an earlier sibling) already claimed.
          !claimedTierTwoPaths.has(entry.path),
      )
      .sort(sortTierTwoFiles)
      .slice(0, TIER_TWO_PER_AREA_CAP);

    tierTwoFiles.push(...areaFiles);
    for (const file of areaFiles) {
      claimedTierTwoPaths.add(file.path);
    }
  }

  // Cap after the sort so the highest-priority files across all areas survive.
  const sortedTierTwoFiles: RepoTreeEntry[] = tierTwoFiles
    .sort(sortTierTwoFiles)
    .slice(0, TIER_TWO_TOTAL_CAP);

  const tierThreeEntries = index
    .findEntriesByPathMatching({
      pattern: TIER_THREE_PATH_PATTERN,
    })
    .filter((entry) => isWithinSizeLimit(entry.sizeBytes))
    .sort((a, b) => {
      const aIsArchitectureOrDesign = ARCHITECTURE_OR_DESIGN_FILE_PATTERN.test(
        a.name,
      );
      const bIsArchitectureOrDesign = ARCHITECTURE_OR_DESIGN_FILE_PATTERN.test(
        b.name,
      );

      // Group first: architecture/design files before the other docs files.
      // Two files in the same group tie here and fall through to the next key.
      if (aIsArchitectureOrDesign !== bIsArchitectureOrDesign) {
        return aIsArchitectureOrDesign ? -1 : 1;
      }

      return compareByDepthThenPath(a, b);
    })
    .slice(0, TIER_THREE_TOTAL_CAP);

  return [...tierOneFiles, ...sortedTierTwoFiles, ...tierThreeEntries].map(
    (entry) => entry.path,
  );
}
