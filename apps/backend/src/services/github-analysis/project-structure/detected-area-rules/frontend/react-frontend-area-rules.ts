import type { AreaRuleSignalScores } from '../project-structure-area-rule-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

type ReactFrontendSignal =
  | 'react-vite-config'
  | 'react-root-index-html'
  | 'react-public-index-html'
  | 'react-main-jsx-entry'
  | 'react-index-jsx-entry'
  | 'react-index-js-entry'
  | 'react-root-app-jsx'
  | 'react-root-app-js'
  | 'react-style-file'
  | 'react-component-jsx'
  | 'react-route-component';

const REACT_FRONTEND_SIGNAL_SCORES = {
  'react-vite-config': 1,
  'react-root-index-html': 1,
  'react-public-index-html': 1,
  'react-main-jsx-entry': 2,
  'react-index-jsx-entry': 2,
  'react-index-js-entry': 1,
  'react-root-app-jsx': 3,
  'react-root-app-js': 2,
  'react-style-file': 1,
  'react-component-jsx': 1,
  'react-route-component': 1,
} satisfies AreaRuleSignalScores<ReactFrontendSignal>;

/**
 * Adds `Frontend app` candidates from non-framework React path evidence.
 * React-specific signals stay internal while detected areas remain role-based.
 *
 * Inputs: `candidates` (shared candidate map) and `index` (repository entry
 * index) from `DetectedAreaRuleContext`.
 * Output: none; mutates `candidates` in place.
 * Side effects: adds one `Frontend app` / `React` candidate per owner path that
 * passes the app-shape gate and is not vetoed by Next.js or React Router
 * competing framework proof at the same owner path.
 *
 * Gate: an owner emits only when its counted signals form one of three React
 * app shapes -- a Vite React shell (`vite.config` + root `index.html` +
 * `src/main.{jsx,tsx}` + `src/App.{jsx,tsx}`), a Create React App shell
 * (`public/index.html` + an `src/index.{js,jsx}` entry + an `src/App.{js,jsx}`
 * root), or a structured React layout (`src/App.{jsx,tsx}` plus a component or
 * page/view module). The CRA branch relies on the engine's `and` node to AND
 * two independent `hasOneOf` groups (entry variant and root variant) together.
 */
export function addReactFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<ReactFrontendSignal>({
    candidates,
    index,
    detectedArea: 'Frontend app',
    primaryTech: 'React',
    relatedTechs: [],
    signalScores: REACT_FRONTEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'react-vite-config',
        regex: /^vite\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'react-root-index-html',
        regex:
          /^(index\.html|apps\/[^/]+\/index\.html|packages\/[^/]+\/index\.html)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-public-index-html',
        regex: /(^|\/)public\/index\.html$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-main-jsx-entry',
        regex: /(^|\/)src\/main\.(jsx|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-index-jsx-entry',
        regex: /(^|\/)src\/index\.(jsx|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-index-js-entry',
        regex: /(^|\/)src\/index\.js$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-root-app-jsx',
        regex: /(^|\/)src\/app\.(jsx|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-root-app-js',
        regex: /(^|\/)src\/app\.js$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-style-file',
        regex: /(^|\/)src\/(app|index)\.css$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-component-jsx',
        regex: /(^|\/)src\/components\/(?:.*\/)?.+\.(jsx|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-route-component',
        regex: /(^|\/)src\/(pages|views)\/(?:.*\/)?.+\.(jsx|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    competingProofSchemas: [
      {
        indexMethod: 'findFilesByNameMatching',
        regex: /^next\.config\./,
      },
      {
        indexMethod: 'findEntriesByPathMatching',
        regex:
          /(^|\/)(src\/)?app\/(?:.*\/)?(page|layout|route)\.(js|jsx|ts|tsx|mdx)$/,
      },
      {
        indexMethod: 'findEntriesByPathMatching',
        regex: /(^|\/)(src\/)?pages\/(_app|_document|_error)\.(js|jsx|ts|tsx)$/,
      },
      {
        indexMethod: 'findFilesByNameMatching',
        regex: /^react-router\.config\.(js|mjs|cjs|ts)$/,
      },
      {
        indexMethod: 'findEntriesByPathMatching',
        regex: /(^|\/)app\/root\.(js|jsx|ts|tsx)$/,
      },
      {
        indexMethod: 'findEntriesByPathMatching',
        regex: /(^|\/)app\/routes\.(js|ts)$/,
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              hasAllOf: [
                'react-vite-config',
                'react-root-index-html',
                'react-main-jsx-entry',
                'react-root-app-jsx',
              ],
            },
            {
              has: 'react-public-index-html',
              and: [
                {
                  hasOneOf: ['react-index-js-entry', 'react-index-jsx-entry'],
                },
                {
                  hasOneOf: ['react-root-app-js', 'react-root-app-jsx'],
                },
              ],
            },
            {
              has: 'react-root-app-jsx',
              hasOneOf: ['react-component-jsx', 'react-route-component'],
            },
          ],
        },
      },
    },
  });
}
