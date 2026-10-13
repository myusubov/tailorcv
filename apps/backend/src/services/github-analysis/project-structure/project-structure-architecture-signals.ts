import type {
  ArchitectureSignal,
  DetectedProjectArea,
  RepoTreeEntry,
} from './project-structure-analyzer.types';
import { excludingDemoAndTestFolders } from './detected-area-rules/infrastructure-as-code/demo-and-test-folders';
import { buildEntryIndex } from './project-structure-entry-index';
import { normalizePath } from './project-structure-path-utils';

// Layer-style folder names, matched against the last segment of the lowercased
// directory path at any depth. The wrapper rejects any path with a demo or test
// folder segment, so `tests/controllers` is never found.
const LAYER_FOLDER_PATTERN = excludingDemoAndTestFolders(
  '(?:.*/)?(?:routes|controllers|handlers|services|usecases|domain|repositories|models|entities)',
);

// Returns the Layered backend signal, or null when no parent folder inside a
// Backend API area holds at least two distinct layer folder names.
function buildLayeredBackendSignal({
  entries,
  detectedAreas,
}: {
  entries: RepoTreeEntry[];
  detectedAreas: DetectedProjectArea[];
}): ArchitectureSignal | null {
  const index = buildEntryIndex(entries);

  const layerFolders = index.findDirectoriesByPathMatching({
    pattern: LAYER_FOLDER_PATTERN,
  });

  // Folders only count inside a Backend API area. A root area owns the whole
  // repo, so it places no limit on where a folder can be.
  const backendAreaPaths = detectedAreas
    .filter((area) => area.name === 'Backend API')
    .map((area) => normalizePath({ path: area.path }));
  const isInsideBackendArea = (folderPath: string): boolean =>
    backendAreaPaths.some(
      (areaPath) =>
        areaPath === '.' ||
        normalizePath({ path: folderPath }).startsWith(`${areaPath}/`),
    );

  // Group layer folders by parent, so a parent holding two or more can be
  // checked after the loop. A root-level folder has no parent path, so it
  // groups under `.`.
  const foldersByParent = new Map<string, RepoTreeEntry[]>();
  for (const folder of layerFolders) {
    if (!isInsideBackendArea(folder.path)) continue;

    const parent = folder.parentPath ?? '.';
    const siblings = foldersByParent.get(parent) ?? [];
    siblings.push(folder);
    foldersByParent.set(parent, siblings);
  }

  // Keep only parents that hold at least two distinct layer names. One entry
  // holds the folders of every qualifying parent.
  const evidence = [...foldersByParent.values()]
    .filter(
      (folders) =>
        new Set(folders.map((folder) => folder.name.toLowerCase())).size >= 2,
    )
    .flatMap((folders) => folders.map((folder) => folder.path))
    .sort((a, b) => a.localeCompare(b));

  return evidence.length > 0 ? { signal: 'Layered backend', evidence } : null;
}

// Returns the Client/server separation signal, or null when no client area and
// server area sit at different owner paths.
function buildClientServerSignal(
  detectedAreas: DetectedProjectArea[],
): ArchitectureSignal | null {
  const clientAreas = detectedAreas.filter(
    ({ name }) => name === 'Mobile app' || name === 'Frontend app',
  );

  const serverAreas = detectedAreas.filter(
    ({ name }) => name === 'Backend API',
  );

  // An area counts when at least one area on the other side has a different
  // path. Clients and servers at the same path are one combined app.
  const hasPartnerAtOtherPath = ({
    area,
    partners,
  }: {
    area: DetectedProjectArea;
    partners: DetectedProjectArea[];
  }): boolean => partners.some((partner) => partner.path !== area.path);

  const separated = [
    ...clientAreas.filter((area) =>
      hasPartnerAtOtherPath({ area, partners: serverAreas }),
    ),
    ...serverAreas.filter((area) =>
      hasPartnerAtOtherPath({ area, partners: clientAreas }),
    ),
  ];
  if (separated.length === 0) return null;

  const evidence = separated
    .map(
      ({ inferredTechnologies, path }) =>
        `${inferredTechnologies.primary} @ ${path}`,
    )
    .sort((a, b) => a.localeCompare(b));

  return { signal: 'Client/server separation', evidence };
}

/**
 * Builds the structure-derived architecture signals for one repository tree.
 * Emits `Layered backend` and `Client/server separation` when each has evidence,
 * sorted. A signal with no evidence is left out, so the list can be empty.
 */
export function buildArchitectureSignals({
  entries,
  detectedAreas,
}: {
  entries: RepoTreeEntry[];
  detectedAreas: DetectedProjectArea[];
}): ArchitectureSignal[] {
  const signals = [
    buildLayeredBackendSignal({ entries, detectedAreas }),
    buildClientServerSignal(detectedAreas),
  ];

  return signals.filter(
    (signal): signal is ArchitectureSignal => signal !== null,
  );
}
