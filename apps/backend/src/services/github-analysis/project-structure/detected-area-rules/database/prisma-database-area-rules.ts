import {
    countAreaRuleSignal,
    createAreaRuleCandidateMap,
    type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type PrismaDatabaseSignal =
    | 'prisma-schema'
    | 'prisma-schema-fragment'
    | 'prisma-config'
    | 'prisma-migrations-directory'
    | 'prisma-migration-file'
    | 'prisma-migration-lock'
    | 'prisma-seed-file';

const hasPrismaAppShape = (countedSignals: PrismaDatabaseSignal): boolean => {
    return true
}

export function addPrismaDatabaseAreas({ candidates, index }: DetectedAreaRuleContext) {
    const prismaAreasByOwner = createAreaRuleCandidateMap();

};