import { describe, expect, it } from 'vitest';
import type { DetectedAreaTechnology } from './project-structure-analyzer.types';
import type {
  AreaCandidate,
  DetectedAreaName,
} from './project-structure-detected-areas.types';
import { reconcileCandidates } from './project-structure-reconcile-candidates';

type CandidateKey =
  `${DetectedAreaName}::${string}::${DetectedAreaTechnology}`;

/**
 * Builds a candidate map from bare keys. Reconciliation only reads the key
 * scheme `${name}::${path}::${primaryTech}`, so every other field is minimal.
 */
function buildCandidates(keys: CandidateKey[]): Map<string, AreaCandidate> {
  return new Map(
    keys.map((key): [string, AreaCandidate] => {
      const [name, path, primary] = key.split('::') as [
        DetectedAreaName,
        string,
        DetectedAreaTechnology,
      ];

      return [
        key,
        {
          name,
          path,
          score: 0,
          evidence: new Set<string>(),
          inferredTechnologies: { primary, related: new Set() },
        },
      ];
    }),
  );
}

describe('reconcileCandidates', () => {
  describe('same owner path: meta framework replaces its parent', () => {
    it.each<{ pair: string; meta: CandidateKey; parent: CandidateKey }>([
      {
        pair: 'Next.js over React',
        meta: 'Frontend app::.::Next.js',
        parent: 'Frontend app::.::React',
      },
      {
        pair: 'Nuxt over Vue',
        meta: 'Frontend app::.::Nuxt',
        parent: 'Frontend app::.::Vue',
      },
      {
        pair: 'React Router over React',
        meta: 'Frontend app::.::React Router',
        parent: 'Frontend app::.::React',
      },
      {
        pair: 'SvelteKit over Svelte',
        meta: 'Frontend app::.::SvelteKit',
        parent: 'Frontend app::.::Svelte',
      },
      {
        pair: 'Expo over React Native',
        meta: 'Mobile app::.::Expo',
        parent: 'Mobile app::.::React Native',
      },
      {
        pair: 'NestJS over Express.js',
        meta: 'Backend API::.::NestJS',
        parent: 'Backend API::.::Express.js',
      },
    ])('keeps only the meta framework: $pair', ({ meta, parent }) => {
      const candidates = buildCandidates([meta, parent]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual([meta]);
    });

    it('keeps only the meta framework when the parent is inserted first', () => {
      const candidates = buildCandidates([
        'Frontend app::.::React',
        'Frontend app::.::Next.js',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual(['Frontend app::.::Next.js']);
    });

    it('applies the same rule at a non-root owner path', () => {
      const candidates = buildCandidates([
        'Frontend app::apps/web::Next.js',
        'Frontend app::apps/web::React',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual(['Frontend app::apps/web::Next.js']);
    });

    it('drops the shared parent once when two meta frameworks claim it', () => {
      const candidates = buildCandidates([
        'Frontend app::.::Next.js',
        'Frontend app::.::React Router',
        'Frontend app::.::React',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::.::Next.js',
        'Frontend app::.::React Router',
      ]);
    });

    it('reconciles two independent families on one path separately', () => {
      const candidates = buildCandidates([
        'Frontend app::.::Next.js',
        'Frontend app::.::React',
        'Frontend app::.::Nuxt',
        'Frontend app::.::Vue',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::.::Next.js',
        'Frontend app::.::Nuxt',
      ]);
    });
  });

  describe('nothing to reconcile', () => {
    it('leaves an empty map empty', () => {
      const candidates = buildCandidates([]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual([]);
    });

    it.each<CandidateKey>([
      'Frontend app::.::React',
      'Frontend app::.::Vue',
      'Frontend app::.::Svelte',
      'Mobile app::.::React Native',
      'Backend API::.::Express.js',
    ])('keeps a parent framework alone: %s', (parent) => {
      const candidates = buildCandidates([parent]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual([parent]);
    });

    it.each<CandidateKey>([
      'Frontend app::.::Next.js',
      'Frontend app::.::Nuxt',
      'Frontend app::.::React Router',
      'Frontend app::.::SvelteKit',
      'Mobile app::.::Expo',
      'Backend API::.::NestJS',
    ])('keeps a meta framework alone: %s', (meta) => {
      const candidates = buildCandidates([meta]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual([meta]);
    });

    it('keeps frameworks with no meta/parent relationship on one path', () => {
      const candidates = buildCandidates([
        'Frontend app::.::Angular',
        'Frontend app::.::Astro',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::.::Angular',
        'Frontend app::.::Astro',
      ]);
    });
  });

  describe('a meta framework only replaces its own parent', () => {
    it("keeps another family's parent when only a foreign meta framework is present", () => {
      const candidates = buildCandidates([
        'Frontend app::.::Next.js',
        'Frontend app::.::Vue',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::.::Next.js',
        'Frontend app::.::Vue',
      ]);
    });

    it('does not let Expo remove a React claim in a different area', () => {
      const candidates = buildCandidates([
        'Mobile app::.::Expo',
        'Frontend app::.::React',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::.::React',
        'Mobile app::.::Expo',
      ]);
    });
  });

  describe('different owner paths never compete', () => {
    it('keeps meta and parent claims that live in different apps', () => {
      const candidates = buildCandidates([
        'Frontend app::apps/marketing::Next.js',
        'Frontend app::apps/admin::React',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::apps/admin::React',
        'Frontend app::apps/marketing::Next.js',
      ]);
    });

    it('keeps a parent claim on a nested path under a meta framework owner', () => {
      const candidates = buildCandidates([
        'Frontend app::apps/web::Next.js',
        'Frontend app::apps/web/src::React',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::apps/web/src::React',
        'Frontend app::apps/web::Next.js',
      ]);
    });

    it('keeps the same parent framework on several paths', () => {
      const candidates = buildCandidates([
        'Frontend app::apps/admin::React',
        'Frontend app::apps/docs::React',
        'Frontend app::packages/ui::React',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::apps/admin::React',
        'Frontend app::apps/docs::React',
        'Frontend app::packages/ui::React',
      ]);
    });
  });

  describe('different area names on one path never compete', () => {
    it('keeps unrelated areas alongside a reconciled frontend claim', () => {
      const candidates = buildCandidates([
        'Frontend app::.::Next.js',
        'Frontend app::.::React',
        'Backend API::.::Express.js',
        'Containerization::.::Docker',
        'CI/CD workflows::.::GitHub Actions',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Backend API::.::Express.js',
        'CI/CD workflows::.::GitHub Actions',
        'Containerization::.::Docker',
        'Frontend app::.::Next.js',
      ]);
    });
  });

  describe('mixed monorepo', () => {
    it('reconciles each owner path independently in one pass', () => {
      const candidates = buildCandidates([
        'Frontend app::apps/web::Next.js',
        'Frontend app::apps/web::React',
        'Frontend app::apps/admin::React',
        'Mobile app::apps/mobile::Expo',
        'Mobile app::apps/mobile::React Native',
        'Backend API::apps/api::NestJS',
        'Backend API::apps/api::Express.js',
        'Frontend app::packages/ui::React',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Backend API::apps/api::NestJS',
        'Frontend app::apps/admin::React',
        'Frontend app::apps/web::Next.js',
        'Frontend app::packages/ui::React',
        'Mobile app::apps/mobile::Expo',
      ]);
    });
  });

  describe('idempotence', () => {
    it('yields the same keys when run a second time', () => {
      const candidates = buildCandidates([
        'Frontend app::.::Next.js',
        'Frontend app::.::React',
        'Backend API::apps/api::NestJS',
        'Backend API::apps/api::Express.js',
      ]);

      reconcileCandidates(candidates);
      const afterFirstRun = [...candidates.keys()].sort();
      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual(afterFirstRun);
      expect(afterFirstRun).toEqual([
        'Backend API::apps/api::NestJS',
        'Frontend app::.::Next.js',
      ]);
    });
  });

  describe('native Android/iOS shells yield to a cross-platform host', () => {
    it.each<{ host: CandidateKey; shell: CandidateKey }>([
      { host: 'Mobile app::.::Flutter', shell: 'Mobile app::.::Android' },
      { host: 'Mobile app::.::Flutter', shell: 'Mobile app::.::iOS' },
      { host: 'Mobile app::.::React Native', shell: 'Mobile app::.::Android' },
      { host: 'Mobile app::.::React Native', shell: 'Mobile app::.::iOS' },
      { host: 'Mobile app::.::Expo', shell: 'Mobile app::.::Android' },
      { host: 'Mobile app::.::Expo', shell: 'Mobile app::.::iOS' },
    ])('keeps only the host: $host over $shell', ({ host, shell }) => {
      const candidates = buildCandidates([host, shell]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual([host]);
    });

    it('drops both shells under a Flutter host', () => {
      const candidates = buildCandidates([
        'Mobile app::.::Flutter',
        'Mobile app::.::Android',
        'Mobile app::.::iOS',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual(['Mobile app::.::Flutter']);
    });

    it('drops both shells under a React Native host', () => {
      const candidates = buildCandidates([
        'Mobile app::.::React Native',
        'Mobile app::.::Android',
        'Mobile app::.::iOS',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual(['Mobile app::.::React Native']);
    });

    it('keeps Expo and drops React Native and both shells when all four share a path', () => {
      const candidates = buildCandidates([
        'Mobile app::.::Expo',
        'Mobile app::.::React Native',
        'Mobile app::.::Android',
        'Mobile app::.::iOS',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual(['Mobile app::.::Expo']);
    });

    it('keeps native Android alone', () => {
      const candidates = buildCandidates(['Mobile app::.::Android']);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual(['Mobile app::.::Android']);
    });

    it('keeps native iOS alone', () => {
      const candidates = buildCandidates(['Mobile app::.::iOS']);

      reconcileCandidates(candidates);

      expect([...candidates.keys()]).toEqual(['Mobile app::.::iOS']);
    });

    it('keeps native Android and iOS together when no host shares their path', () => {
      const candidates = buildCandidates([
        'Mobile app::.::Android',
        'Mobile app::.::iOS',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Mobile app::.::Android',
        'Mobile app::.::iOS',
      ]);
    });

    it('keeps a native shell when the host lives on a different path', () => {
      const candidates = buildCandidates([
        'Mobile app::apps/field-tool::Flutter',
        'Mobile app::apps/native-android::Android',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Mobile app::apps/field-tool::Flutter',
        'Mobile app::apps/native-android::Android',
      ]);
    });

    it('reconciles hosts and shells per owner path in a mobile monorepo', () => {
      const candidates = buildCandidates([
        'Mobile app::apps/field-tool::Flutter',
        'Mobile app::apps/field-tool::Android',
        'Mobile app::apps/field-tool::iOS',
        'Mobile app::apps/companion::Expo',
        'Mobile app::apps/companion::React Native',
        'Mobile app::apps/companion::Android',
        'Mobile app::apps/native-ios::iOS',
      ]);

      reconcileCandidates(candidates);

      expect([...candidates.keys()].sort()).toEqual([
        'Mobile app::apps/companion::Expo',
        'Mobile app::apps/field-tool::Flutter',
        'Mobile app::apps/native-ios::iOS',
      ]);
    });
  });
});
