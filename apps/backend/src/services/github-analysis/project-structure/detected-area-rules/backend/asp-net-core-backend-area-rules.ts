import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import type { AreaRuleSignalScores } from '../project-structure-area-rule-candidates';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

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

/**
 * Adds `Backend API` candidates from ASP.NET Core path evidence.
 *
 * Inputs: `candidates` (shared candidate map) and `index` (repository entry
 * index) from `DetectedAreaRuleContext`.
 * Output: none; mutates `candidates` in place.
 * Side effects: adds one `Backend API` / `ASP.NET Core` candidate (related
 * technologies `.NET` and `C#`) per owner path whose counted signals form a
 * web-host application shape.
 *
 * Signals are grouped by the generic `ownerPathForApplicationArea` owner and
 * counted once per signal type across `.csproj` files, `Program.cs`,
 * `Startup.cs`, `appsettings.json` / `appsettings.<env>.json`,
 * `Properties/launchSettings.json`, `Controllers/*Controller.cs`, an
 * `Endpoints/` folder, Razor Pages under `Pages/`, MVC views under `Views/`,
 * and a `wwwroot` directory.
 *
 * The `appsettings` schemas match on full path (not basename) and carry a
 * leading negative lookahead so `wwwroot/appsettings*.json` -- a client-side
 * asset config copy rather than server config -- never counts as server
 * appsettings proof. This replaces the former hand-written per-entry exclusion
 * predicate; no engine change is required because the exclusion is expressible
 * in the entry regex once path matching is used.
 *
 * Gate: an owner emits only when its counted signals form one of five
 * web-host shapes -- a host entry (`Program.cs` or `Startup.cs`) plus project
 * file and controller; `Program.cs` plus project file and an endpoint folder;
 * project file plus any appsettings and a transport handler or server-UI
 * signal; `Program.cs` plus project file, any appsettings, and launch
 * settings; or a host entry plus project file and Razor/MVC server UI backed
 * by any appsettings or `wwwroot`. Shapes three and five AND two or three
 * independent `hasOneOf` groups via the engine's `and` condition node.
 */
export function addAspNetCoreBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<AspNetCoreBackendSignal>({
    candidates,
    index,
    detectedArea: 'Backend API',
    primaryTech: 'ASP.NET Core',
    relatedTechs: ['.NET', 'C#'],
    signalScores: ASP_NET_CORE_BACKEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'asp-net-core-project-file',
        regex: /^[^/]+\.csproj$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'asp-net-core-program-entry',
        regex: /^program\.cs$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'asp-net-core-startup-class',
        regex: /^startup\.cs$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'asp-net-core-appsettings',
        regex: /^(?!(?:.*\/)?wwwroot\/)(?:.*\/)?appsettings\.json$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'asp-net-core-environment-appsettings',
        regex: /^(?!(?:.*\/)?wwwroot\/)(?:.*\/)?appsettings\.[^/]+\.json$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'asp-net-core-launch-settings',
        regex: /(^|\/)properties\/launchsettings\.json$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'asp-net-core-controller',
        regex: /(^|\/)controllers\/(?:.*\/)?[^/]+controller\.cs$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'asp-net-core-minimal-endpoint',
        regex: /(^|\/)endpoints\/(?:.*\/)?[^/]+\.cs$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'asp-net-core-razor-pages',
        regex: /(^|\/)pages\/(?:.*\/)?[^/]+\.cshtml(?:\.cs)?$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'asp-net-core-mvc-views',
        regex: /(^|\/)views\/(?:.*\/)?[^/]+\.cshtml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'asp-net-core-wwwroot',
        regex: /(^|\/)wwwroot$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              hasOneOf: [
                'asp-net-core-program-entry',
                'asp-net-core-startup-class',
              ],
              hasAllOf: [
                'asp-net-core-project-file',
                'asp-net-core-controller',
              ],
            },
            {
              hasAllOf: [
                'asp-net-core-program-entry',
                'asp-net-core-project-file',
                'asp-net-core-minimal-endpoint',
              ],
            },
            {
              has: 'asp-net-core-project-file',
              and: [
                {
                  hasOneOf: [
                    'asp-net-core-appsettings',
                    'asp-net-core-environment-appsettings',
                  ],
                },
                {
                  hasOneOf: [
                    'asp-net-core-controller',
                    'asp-net-core-minimal-endpoint',
                    'asp-net-core-razor-pages',
                    'asp-net-core-mvc-views',
                  ],
                },
              ],
            },
            {
              hasAllOf: [
                'asp-net-core-program-entry',
                'asp-net-core-project-file',
                'asp-net-core-launch-settings',
              ],
              hasOneOf: [
                'asp-net-core-appsettings',
                'asp-net-core-environment-appsettings',
              ],
            },
            {
              has: 'asp-net-core-project-file',
              and: [
                {
                  hasOneOf: [
                    'asp-net-core-program-entry',
                    'asp-net-core-startup-class',
                  ],
                },
                {
                  hasOneOf: [
                    'asp-net-core-razor-pages',
                    'asp-net-core-mvc-views',
                  ],
                },
                {
                  hasOneOf: [
                    'asp-net-core-appsettings',
                    'asp-net-core-environment-appsettings',
                    'asp-net-core-wwwroot',
                  ],
                },
              ],
            },
          ],
        },
      },
    },
  });
}
