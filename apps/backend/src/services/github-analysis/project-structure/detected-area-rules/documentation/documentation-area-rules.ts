import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addAntoraDocumentationAreas } from './antora-documentation-area-rules';
import { addDocFxDocumentationAreas } from './docfx-documentation-area-rules';
import { addDocusaurusDocumentationAreas } from './docusaurus-documentation-area-rules';
import { addDumiDocumentationAreas } from './dumi-documentation-area-rules';
import { addFumadocsDocumentationAreas } from './fumadocs-documentation-area-rules';
import { addMdBookDocumentationAreas } from './mdbook-documentation-area-rules';
import { addMkDocsDocumentationAreas } from './mkdocs-documentation-area-rules';
import { addRspressDocumentationAreas } from './rspress-documentation-area-rules';
import { addSphinxDocumentationAreas } from './sphinx-documentation-area-rules';
import { addStarlightDocumentationAreas } from './starlight-documentation-area-rules';
import { addVitePressDocumentationAreas } from './vitepress-documentation-area-rules';
import { addVuePressDocumentationAreas } from './vuepress-documentation-area-rules';

/**
 * Applies documentation detected-area rules to the shared candidate map.
 *
 * Framework-specific rules live in sibling modules and emit `Documentation`
 * candidates for documentation-site generators. Only the Sphinx and MkDocs
 * detectors are implemented; every other framework module is an empty scaffold
 * that adds no candidates until it lands.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: fans out to the twelve framework detectors below. Today only
 * Sphinx and MkDocs insert or update `Documentation` candidates; the rest are
 * no-ops.
 * Limitations: the dispatch order is by expected popularity, not precedence;
 * it carries no meaning until a detector claims the same owner as another.
 */
export function addDocumentationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addSphinxDocumentationAreas({ candidates, index });
  addMkDocsDocumentationAreas({ candidates, index });
  addDocusaurusDocumentationAreas({ candidates, index });
  addMdBookDocumentationAreas({ candidates, index });
  addStarlightDocumentationAreas({ candidates, index });
  addDocFxDocumentationAreas({ candidates, index });
  addAntoraDocumentationAreas({ candidates, index });
  addFumadocsDocumentationAreas({ candidates, index });
  addVitePressDocumentationAreas({ candidates, index });
  addVuePressDocumentationAreas({ candidates, index });
  addDumiDocumentationAreas({ candidates, index });
  addRspressDocumentationAreas({ candidates, index });
}
