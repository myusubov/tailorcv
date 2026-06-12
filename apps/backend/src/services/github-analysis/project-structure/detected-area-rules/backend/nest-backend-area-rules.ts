import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { AreaRuleSignalScores } from '../project-structure-area-rule-candidates';

type NestBackendSignal =
    | 'next-config'
    | 'app-router-core'
    | 'app-router-support'
    | 'pages-router-special'
    | 'pages-router-route'
    | 'route-directory';


const NEST_BACKEND_SIGNAL_SCORES = {
    'next-config': 4,
    'app-router-core': 4,
    'pages-router-special': 4,
    'pages-router-route': 3,
    'app-router-support': 2,
    'route-directory': 1,
} satisfies AreaRuleSignalScores<NestBackendSignal>;

function hasNestBackendShape({
    countedSignals,
}: {
    countedSignals: Set<NestBackendSignal>;
}): boolean {
    const hasNextConfig = countedSignals.has('next-config');
    const hasAppRouterCore = countedSignals.has('app-router-core');
    const hasPagesRouterSpecial = countedSignals.has('pages-router-special');

    return hasNextConfig || hasAppRouterCore || hasPagesRouterSpecial;
}


/**
 * Adds `Backend API` candidates from NestJS path evidence.
 */
export function addNestBackendAreas({ candidates, index }: DetectedAreaRuleContext) {


}
