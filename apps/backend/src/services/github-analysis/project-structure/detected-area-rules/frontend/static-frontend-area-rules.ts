import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const STATIC_FRONTEND_SIGNAL_SCORES = {
  'static-root-index-html': 2,
  'static-root-html-page': 1,
  'static-root-style-file': 1,
  'static-root-script-file': 1,
  'static-css-directory-file': 1,
  'static-js-directory-file': 1,
  'static-vite-config': 1,
  'static-src-main-script': 1,
  'static-src-style-file': 1,
} as const;

type StaticFrontendSignal = keyof typeof STATIC_FRONTEND_SIGNAL_SCORES;

/**
 * Adds `Frontend app` candidates from plain HTML/CSS/JavaScript path evidence.
 *
 * Static is the final broad frontend fallback: every stronger frontend detector
 * runs first, and `checkForExistingCandidate` makes the engine skip any owner
 * that already carries a `Frontend app` claim so weak vanilla-site shapes never
 * pollute a recognized framework's metadata. Framework proof from sibling
 * owners does not block static output because the veto is keyed on the owner
 * path.
 *
 * An owner passes the gate via any one of: root `index.html` + a root
 * `style.css`/`styles.css`/`main.css`; root `index.html` + a `css/` directory
 * stylesheet; root `index.html` + a non-index root `.html` page + any CSS
 * evidence (root, `css/`, or `src/`); or root `index.html` + a `src/`
 * stylesheet + a Vite config. Static frontend signals stay internal while
 * detected areas remain role-based.
 */
export function addStaticFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<StaticFrontendSignal>({
    candidates,
    index,
    detectedArea: 'Frontend app',
    primaryTech: 'Static Web',
    relatedTechs: [],
    checkForExistingCandidate: true,
    signalScores: STATIC_FRONTEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'static-root-index-html',
        regex:
          /^(index\.html|apps\/[^/]+\/index\.html|packages\/[^/]+\/index\.html)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'static-root-html-page',
        regex:
          /^(?!index\.html$)[^/]+\.html$|^apps\/[^/]+\/(?!index\.html$)[^/]+\.html$|^packages\/[^/]+\/(?!index\.html$)[^/]+\.html$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'static-root-style-file',
        regex:
          /^(style\.css|styles\.css|main\.css|apps\/[^/]+\/(style\.css|styles\.css|main\.css)|packages\/[^/]+\/(style\.css|styles\.css|main\.css))$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'static-root-script-file',
        regex:
          /^(script\.js|scripts\.js|main\.js|apps\/[^/]+\/(script\.js|scripts\.js|main\.js)|packages\/[^/]+\/(script\.js|scripts\.js|main\.js))$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'static-css-directory-file',
        regex:
          /^(css\/[^/]+\.css|apps\/[^/]+\/css\/[^/]+\.css|packages\/[^/]+\/css\/[^/]+\.css)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'static-js-directory-file',
        regex:
          /^(js\/[^/]+\.js|apps\/[^/]+\/js\/[^/]+\.js|packages\/[^/]+\/js\/[^/]+\.js)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'static-src-style-file',
        regex:
          /^(src\/(style\.css|styles\.css|main\.css|app\.css|index\.css)|apps\/[^/]+\/src\/(style\.css|styles\.css|main\.css|app\.css|index\.css)|packages\/[^/]+\/src\/(style\.css|styles\.css|main\.css|app\.css|index\.css))$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'static-src-main-script',
        regex:
          /^(src\/main\.js|apps\/[^/]+\/src\/main\.js|packages\/[^/]+\/src\/main\.js)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'static-vite-config',
        regex: /^vite\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              hasAllOf: ['static-root-index-html', 'static-root-style-file'],
            },
            {
              hasAllOf: ['static-root-index-html', 'static-css-directory-file'],
            },
            {
              hasAllOf: ['static-root-index-html', 'static-root-html-page'],
              hasOneOf: [
                'static-root-style-file',
                'static-css-directory-file',
                'static-src-style-file',
              ],
            },
            {
              hasAllOf: [
                'static-root-index-html',
                'static-src-style-file',
                'static-vite-config',
              ],
            },
          ],
        },
      },
    },
  });
}
