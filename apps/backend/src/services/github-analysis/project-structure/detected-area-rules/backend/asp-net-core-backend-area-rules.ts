import type { RepoTreeEntry } from '../../project-structure-analyzer.types';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleCandidate,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';

type AspNetCoreBackendSignal =
  | 'asp-net-core-project-file'
  | 'asp-net-core-program-entry'
  | 'asp-net-core-startup-class'
  | 'asp-net-core-appsettings'
  | 'asp-net-core-environment-appsettings'
  | 'asp-net-core-launch-settings'
  | 'asp-net-core-controller'
  | 'asp-net-core-minimal-endpoint'
  | 'asp-net-core-razor-pages'
  | 'asp-net-core-mvc-views'
  | 'asp-net-core-wwwroot';

const ASP_NET_CORE_BACKEND_SIGNAL_SCORES = {
  'asp-net-core-project-file': 1,
  'asp-net-core-program-entry': 2,
  'asp-net-core-startup-class': 3,
  'asp-net-core-appsettings': 3,
  'asp-net-core-environment-appsettings': 2,
  'asp-net-core-launch-settings': 2,
  'asp-net-core-controller': 2,
  'asp-net-core-minimal-endpoint': 2,
  'asp-net-core-razor-pages': 2,
  'asp-net-core-mvc-views': 2,
  'asp-net-core-wwwroot': 1,
} satisfies AreaRuleSignalScores<AspNetCoreBackendSignal>;

function hasAspNetCoreBackendShape({
  countedSignals,
}: {
  countedSignals: Set<AspNetCoreBackendSignal>;
}): boolean {
  const hasProjectFile = countedSignals.has('asp-net-core-project-file');
  const hasProgramEntry = countedSignals.has('asp-net-core-program-entry');
  const hasStartupClass = countedSignals.has('asp-net-core-startup-class');
  const hasAppsettings = countedSignals.has('asp-net-core-appsettings');
  const hasEnvironmentAppsettings = countedSignals.has(
    'asp-net-core-environment-appsettings',
  );
  const hasLaunchSettings = countedSignals.has('asp-net-core-launch-settings');
  const hasController = countedSignals.has('asp-net-core-controller');
  const hasMinimalEndpoint = countedSignals.has(
    'asp-net-core-minimal-endpoint',
  );
  const hasRazorPages = countedSignals.has('asp-net-core-razor-pages');
  const hasMvcViews = countedSignals.has('asp-net-core-mvc-views');
  const hasWwwroot = countedSignals.has('asp-net-core-wwwroot');

  const hasConfig = hasAppsettings || hasEnvironmentAppsettings;
  const hasHostEntry = hasProgramEntry || hasStartupClass;
  const hasTransportHandler = hasController || hasMinimalEndpoint;
  const hasServerUi = hasRazorPages || hasMvcViews;

  const hasControllerApiShape = hasHostEntry && hasProjectFile && hasController;

  const hasMinimalApiShape =
    hasProgramEntry && hasProjectFile && hasMinimalEndpoint;

  const hasConfigBackedWebShape =
    hasProjectFile && hasConfig && (hasTransportHandler || hasServerUi);

  const hasCanonicalMinimalHostShape =
    hasProgramEntry && hasProjectFile && hasConfig && hasLaunchSettings;

  const hasServerRenderedShape =
    hasHostEntry && hasProjectFile && hasServerUi && (hasConfig || hasWwwroot);

  return (
    hasControllerApiShape ||
    hasMinimalApiShape ||
    hasConfigBackedWebShape ||
    hasCanonicalMinimalHostShape ||
    hasServerRenderedShape
  );
}

function isWwwrootConfigPath({
  entry,
}: {
  entry: Pick<RepoTreeEntry, 'path'>;
}): boolean {
  const path = entry.path.toLowerCase();

  return path.startsWith('wwwroot/') || path.includes('/wwwroot/');
}

function countAspNetCoreBackendSignal({
  areasByOwner,
  entry,
  signal,
}: {
  areasByOwner: Map<string, AreaRuleCandidate<AspNetCoreBackendSignal>>;
  entry: RepoTreeEntry;
  signal: AspNetCoreBackendSignal;
}): void {
  if (
    (signal === 'asp-net-core-appsettings' ||
      signal === 'asp-net-core-environment-appsettings') &&
    isWwwrootConfigPath({ entry })
  ) {
    return;
  }

  countAreaRuleSignal({
    areasByOwner,
    entry,
    signal,
    score: ASP_NET_CORE_BACKEND_SIGNAL_SCORES[signal],
  });
}

/**
 * Adds `Backend API` candidates from ASP.NET Core path evidence.
 */
export function addAspNetCoreBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const aspNetCoreAreasByOwner =
    createAreaRuleCandidateMap<AspNetCoreBackendSignal>();

  const aspNetCoreProjectFiles = index.findFilesByNameMatching({
    pattern: /^[^/]+\.csproj$/,
  });

  const aspNetCoreProgramEntryFiles = index.findFilesByNameMatching({
    pattern: /^program\.cs$/,
  });

  const aspNetCoreStartupClassFiles = index.findFilesByNameMatching({
    pattern: /^startup\.cs$/,
  });

  const aspNetCoreAppsettingsFiles = index.findFilesByNameMatching({
    pattern: /^appsettings\.json$/,
  });

  const aspNetCoreEnvironmentAppsettingsFiles = index.findFilesByNameMatching({
    pattern: /^appsettings\.[^/]+\.json$/,
  });

  const aspNetCoreLaunchSettingsFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)properties\/launchsettings\.json$/,
  });

  const aspNetCoreControllerFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)controllers\/(?:.*\/)?[^/]+controller\.cs$/,
  });

  const aspNetCoreMinimalEndpointFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)endpoints\/(?:.*\/)?[^/]+\.cs$/,
  });

  const aspNetCoreRazorPageFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)pages\/(?:.*\/)?[^/]+\.cshtml(?:\.cs)?$/,
  });

  const aspNetCoreMvcViewFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)views\/(?:.*\/)?[^/]+\.cshtml$/,
  });

  const aspNetCoreWwwrootDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)wwwroot$/,
  });

  for (const aspNetCoreProjectFile of aspNetCoreProjectFiles) {
    countAspNetCoreBackendSignal({
      areasByOwner: aspNetCoreAreasByOwner,
      entry: aspNetCoreProjectFile,
      signal: 'asp-net-core-project-file',
    });
  }

  for (const aspNetCoreProgramEntryFile of aspNetCoreProgramEntryFiles) {
    countAspNetCoreBackendSignal({
      areasByOwner: aspNetCoreAreasByOwner,
      entry: aspNetCoreProgramEntryFile,
      signal: 'asp-net-core-program-entry',
    });
  }

  for (const aspNetCoreStartupClassFile of aspNetCoreStartupClassFiles) {
    countAspNetCoreBackendSignal({
      areasByOwner: aspNetCoreAreasByOwner,
      entry: aspNetCoreStartupClassFile,
      signal: 'asp-net-core-startup-class',
    });
  }

  for (const aspNetCoreAppsettingsFile of aspNetCoreAppsettingsFiles) {
    countAspNetCoreBackendSignal({
      areasByOwner: aspNetCoreAreasByOwner,
      entry: aspNetCoreAppsettingsFile,
      signal: 'asp-net-core-appsettings',
    });
  }

  for (const aspNetCoreEnvironmentAppsettingsFile of aspNetCoreEnvironmentAppsettingsFiles) {
    countAspNetCoreBackendSignal({
      areasByOwner: aspNetCoreAreasByOwner,
      entry: aspNetCoreEnvironmentAppsettingsFile,
      signal: 'asp-net-core-environment-appsettings',
    });
  }

  for (const aspNetCoreLaunchSettingsFile of aspNetCoreLaunchSettingsFiles) {
    countAspNetCoreBackendSignal({
      areasByOwner: aspNetCoreAreasByOwner,
      entry: aspNetCoreLaunchSettingsFile,
      signal: 'asp-net-core-launch-settings',
    });
  }

  for (const aspNetCoreControllerFile of aspNetCoreControllerFiles) {
    countAspNetCoreBackendSignal({
      areasByOwner: aspNetCoreAreasByOwner,
      entry: aspNetCoreControllerFile,
      signal: 'asp-net-core-controller',
    });
  }

  for (const aspNetCoreMinimalEndpointFile of aspNetCoreMinimalEndpointFiles) {
    countAspNetCoreBackendSignal({
      areasByOwner: aspNetCoreAreasByOwner,
      entry: aspNetCoreMinimalEndpointFile,
      signal: 'asp-net-core-minimal-endpoint',
    });
  }

  for (const aspNetCoreRazorPageFile of aspNetCoreRazorPageFiles) {
    countAspNetCoreBackendSignal({
      areasByOwner: aspNetCoreAreasByOwner,
      entry: aspNetCoreRazorPageFile,
      signal: 'asp-net-core-razor-pages',
    });
  }

  for (const aspNetCoreMvcViewFile of aspNetCoreMvcViewFiles) {
    countAspNetCoreBackendSignal({
      areasByOwner: aspNetCoreAreasByOwner,
      entry: aspNetCoreMvcViewFile,
      signal: 'asp-net-core-mvc-views',
    });
  }

  for (const aspNetCoreWwwrootDirectory of aspNetCoreWwwrootDirectories) {
    countAspNetCoreBackendSignal({
      areasByOwner: aspNetCoreAreasByOwner,
      entry: aspNetCoreWwwrootDirectory,
      signal: 'asp-net-core-wwwroot',
    });
  }

  for (const [ownerPath, ownerCandidate] of aspNetCoreAreasByOwner) {
    if (
      !hasAspNetCoreBackendShape({
        countedSignals: ownerCandidate.countedSignals,
      })
    ) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Backend API',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'ASP.NET Core',
      relatedTechnologies: ['.NET', 'C#'],
    });
  }
}
