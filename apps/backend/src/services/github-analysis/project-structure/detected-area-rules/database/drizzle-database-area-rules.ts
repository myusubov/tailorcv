import {
    countAreaRuleSignal,
    createAreaRuleCandidateMap,
    type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type DrizzleDatabaseSignal =
    | 'drizzle-config'
    | 'drizzle-custom-config'
    | 'drizzle-schema-file'
    | 'drizzle-migration-sql-file'
    | 'drizzle-migration-journal'
    | 'drizzle-migration-snapshot';

const DRIZZLE_DATABASE_SIGNAL_SCORES = {
    'drizzle-config': 4,
    'drizzle-custom-config': 4,
    'drizzle-schema-file': 2,
    'drizzle-migration-sql-file': 2,
    'drizzle-migration-journal': 2,
    'drizzle-migration-snapshot': 2,
} satisfies AreaRuleSignalScores<DrizzleDatabaseSignal>;

const hasDrizzleDatabaseAppShape = (
    countedSignals: Set<DrizzleDatabaseSignal>,
): boolean => {
    const hasConfig =
        countedSignals.has('drizzle-config') ||
        countedSignals.has('drizzle-custom-config');

    const hasSchemaFile = countedSignals.has('drizzle-schema-file');
    const hasMigrationSqlFile = countedSignals.has('drizzle-migration-sql-file');

    const hasMigrationMetadata =
        countedSignals.has('drizzle-migration-journal') ||
        countedSignals.has('drizzle-migration-snapshot');

    const hasMigrationArtifact = hasMigrationSqlFile || hasMigrationMetadata;

    const hasConfigBackedSchema = hasConfig && hasSchemaFile;
    const hasConfigBackedMigration = hasConfig && hasMigrationArtifact;
    const hasGeneratedMigrationSet = hasMigrationSqlFile && hasMigrationMetadata;

    return hasConfigBackedSchema || hasConfigBackedMigration || hasGeneratedMigrationSet;
};

export function addDrizzleDatabaseAreas({
    candidates,
    index,
}: DetectedAreaRuleContext) {
    const drizzleDatabaseAreasByOwner = createAreaRuleCandidateMap<DrizzleDatabaseSignal>();

    const drizzleConfigFiles = index.findEntriesByPathMatching({
        pattern: /(^|\/)drizzle\.config\.(?:ts|js|mjs|cjs|mts|cts)$/,
    });

    const drizzleCustomConfigFiles = index.findEntriesByPathMatching({
        pattern: /(^|\/)drizzle-[^/]+\.config\.(?:ts|js|mjs|cjs|mts|cts)$/,
    });

    const drizzleSchemaFiles = index.findEntriesByPathMatching({
        pattern:
            /(^|\/)(?:(?:src|lib)\/db\/schema(?:\/.+)?|src\/lib\/db\/schema(?:\/.+)?|db\/schema(?:\/.+)?|(?:[^/]+\/)*db\/src\/schema(?:\/.+)?|internal\/db\/src\/schema(?:\/.+)?)\.(?:ts|js|mjs|cjs|mts|cts)$/,
    });

    const drizzleMigrationSqlFiles = index.findEntriesByPathMatching({
        pattern: /(^|\/)(?:drizzle|migrations)(?:\/[^/]+)?\/[^/]+\.sql$/,
    });

    const drizzleMigrationJournalFiles = index.findEntriesByPathMatching({
        pattern: /(^|\/)meta\/_journal\.json$/,
    });

    const drizzleMigrationSnapshotFiles = index.findEntriesByPathMatching({
        pattern: /(^|\/)(?:meta\/[^/]+_snapshot\.json|[^/]+\/snapshot\.json)$/,
    });

    for (const drizzleConfigFile of drizzleConfigFiles) {
        countAreaRuleSignal({
            areasByOwner: drizzleDatabaseAreasByOwner,
            entry: drizzleConfigFile,
            score: DRIZZLE_DATABASE_SIGNAL_SCORES['drizzle-config'],
            signal: 'drizzle-config',
        });
    }

    for (const drizzleCustomConfigFile of drizzleCustomConfigFiles) {
        countAreaRuleSignal({
            areasByOwner: drizzleDatabaseAreasByOwner,
            entry: drizzleCustomConfigFile,
            score: DRIZZLE_DATABASE_SIGNAL_SCORES['drizzle-custom-config'],
            signal: 'drizzle-custom-config',
        });
    }

    for (const drizzleSchemaFile of drizzleSchemaFiles) {
        countAreaRuleSignal({
            areasByOwner: drizzleDatabaseAreasByOwner,
            entry: drizzleSchemaFile,
            score: DRIZZLE_DATABASE_SIGNAL_SCORES['drizzle-schema-file'],
            signal: 'drizzle-schema-file',
        });
    }

    for (const drizzleMigrationSqlFile of drizzleMigrationSqlFiles) {
        countAreaRuleSignal({
            areasByOwner: drizzleDatabaseAreasByOwner,
            entry: drizzleMigrationSqlFile,
            score: DRIZZLE_DATABASE_SIGNAL_SCORES['drizzle-migration-sql-file'],
            signal: 'drizzle-migration-sql-file',
        });
    }

    for (const drizzleMigrationJournalFile of drizzleMigrationJournalFiles) {
        countAreaRuleSignal({
            areasByOwner: drizzleDatabaseAreasByOwner,
            entry: drizzleMigrationJournalFile,
            score: DRIZZLE_DATABASE_SIGNAL_SCORES['drizzle-migration-journal'],
            signal: 'drizzle-migration-journal',
        });
    }

    for (const drizzleMigrationSnapshotFile of drizzleMigrationSnapshotFiles) {
        countAreaRuleSignal({
            areasByOwner: drizzleDatabaseAreasByOwner,
            entry: drizzleMigrationSnapshotFile,
            score: DRIZZLE_DATABASE_SIGNAL_SCORES['drizzle-migration-snapshot'],
            signal: 'drizzle-migration-snapshot',
        });
    }

    for (const [ownerPath, ownerCandidate] of drizzleDatabaseAreasByOwner) {
        if (!hasDrizzleDatabaseAppShape(ownerCandidate.countedSignals)) {
            continue;
        }

        addAreaScore({
            candidates,
            name: 'Database schema',
            path: ownerPath,
            score: ownerCandidate.score,
            evidence: ownerCandidate.evidence,
            primaryTechnology: 'Drizzle',
            relatedTechnologies: [],
        });
    }
}
