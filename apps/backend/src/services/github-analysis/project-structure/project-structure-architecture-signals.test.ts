import { describe, expect, it } from 'vitest';
import type {
  DetectedAreaTechnology,
  DetectedProjectArea,
  RepoTreeEntry,
} from './project-structure-analyzer.types';
import { buildArchitectureSignals } from './project-structure-architecture-signals';
import type { DetectedAreaName } from './project-structure-detected-areas.types';

// Expectations come from the agreed signal rules, not from the implementation:
//
// Layered backend: for each `Backend API` area, group layer-style folders
// (routes, controllers, handlers, services, usecases, domain, repositories,
// models, entities) under the area's path by parent folder. A parent with at
// least two distinct layer names qualifies. Folders inside test folders
// (test, tests, spec) are ignored. Evidence is the qualifying folder paths,
// sorted.
//
// Client/server separation: clients are `Frontend app` and `Mobile app` areas,
// servers are `Backend API` areas. It fires when at least one client and one
// server have different owner paths. Evidence is `Tech @ path`, sorted.
//
// One entry per signal type; no signal means an empty list.

const directory = (path: string): RepoTreeEntry => {
  const parts = path.split('/');

  return {
    path,
    name: parts[parts.length - 1],
    type: 'directory',
    depth: parts.length - 1,
    parentPath: parts.length > 1 ? parts.slice(0, -1).join('/') : null,
    extension: null,
    sizeBytes: null,
  };
};

const directories = (paths: string[]): RepoTreeEntry[] =>
  paths.map(directory);

const area = ({
  name,
  path,
  primary,
}: {
  name: DetectedAreaName;
  path: string;
  primary: DetectedAreaTechnology;
}): DetectedProjectArea => ({
  name,
  path,
  confidence: 1,
  evidence: [],
  inferredTechnologies: { primary, related: [] },
});

const backendArea = (path: string): DetectedProjectArea =>
  area({ name: 'Backend API', path, primary: 'Express.js' });

const frontendArea = (path: string): DetectedProjectArea =>
  area({ name: 'Frontend app', path, primary: 'Next.js' });

const mobileArea = (path: string): DetectedProjectArea =>
  area({ name: 'Mobile app', path, primary: 'Flutter' });

describe('buildArchitectureSignals', () => {
  it('returns no signals for an empty repository', () => {
    expect(buildArchitectureSignals({ entries: [], detectedAreas: [] })).toEqual(
      [],
    );
  });

  describe('Layered backend', () => {
    it('emits one signal with the qualifying folders for an Express-style backend', () => {
      const result = buildArchitectureSignals({
        entries: directories([
          'apps/backend/src/routes',
          'apps/backend/src/controllers',
          'apps/backend/src/services',
          'apps/backend/src/middleware',
        ]),
        detectedAreas: [backendArea('apps/backend')],
      });

      expect(result).toEqual([
        {
          signal: 'Layered backend',
          evidence: [
            'apps/backend/src/controllers',
            'apps/backend/src/routes',
            'apps/backend/src/services',
          ],
        },
      ]);
    });

    it('emits for a Rails-style backend at the repository root (controllers and models)', () => {
      const result = buildArchitectureSignals({
        entries: directories([
          'app/controllers',
          'app/models',
          'app/views',
          'app/helpers',
        ]),
        detectedAreas: [backendArea('.')],
      });

      expect(result).toEqual([
        {
          signal: 'Layered backend',
          evidence: ['app/controllers', 'app/models'],
        },
      ]);
    });

    it.each([
      ['routes', 'services', ['routes', 'services']],
      ['handlers', 'services', ['handlers', 'services']],
      ['usecases', 'controllers', ['controllers', 'usecases']],
      ['domain', 'services', ['domain', 'services']],
      ['repositories', 'services', ['repositories', 'services']],
      ['models', 'services', ['models', 'services']],
      ['entities', 'services', ['entities', 'services']],
      ['controllers', 'services', ['controllers', 'services']],
    ])(
      'counts %s paired with %s as a layer',
      (first, second, expectedNames) => {
        const result = buildArchitectureSignals({
          entries: directories([
            `apps/backend/src/${first}`,
            `apps/backend/src/${second}`,
          ]),
          detectedAreas: [backendArea('apps/backend')],
        });

        expect(result).toEqual([
          {
            signal: 'Layered backend',
            evidence: expectedNames.map((name) => `apps/backend/src/${name}`),
          },
        ]);
      },
    );

    it('includes every layer folder of a qualifying parent, not only two', () => {
      const result = buildArchitectureSignals({
        entries: directories([
          'src/controllers',
          'src/services',
          'src/repositories',
          'src/utils',
        ]),
        detectedAreas: [backendArea('.')],
      });

      expect(result).toEqual([
        {
          signal: 'Layered backend',
          evidence: [
            'src/controllers',
            'src/repositories',
            'src/services',
          ],
        },
      ]);
    });

    it('does not emit for a single layer folder', () => {
      const result = buildArchitectureSignals({
        entries: directories(['apps/backend/src/services']),
        detectedAreas: [backendArea('apps/backend')],
      });

      expect(result).toEqual([]);
    });

    it.each(['utils', 'helpers', 'config', 'lib', 'middleware', 'views'])(
      'does not count %s as a layer name',
      (otherName) => {
        const result = buildArchitectureSignals({
          entries: directories([
            'apps/backend/src/services',
            `apps/backend/src/${otherName}`,
          ]),
          detectedAreas: [backendArea('apps/backend')],
        });

        expect(result).toEqual([]);
      },
    );

    it('does not emit when the two layer folders have different parents', () => {
      const result = buildArchitectureSignals({
        entries: directories(['app/http/controllers', 'app/models']),
        detectedAreas: [backendArea('.')],
      });

      expect(result).toEqual([]);
    });

    it('does not emit when the same layer name repeats under different parents', () => {
      const result = buildArchitectureSignals({
        entries: directories(['src/services', 'client/services']),
        detectedAreas: [backendArea('.')],
      });

      expect(result).toEqual([]);
    });

    it('does not emit without a Backend API area', () => {
      const result = buildArchitectureSignals({
        entries: directories([
          'apps/web/src/controllers',
          'apps/web/src/services',
        ]),
        detectedAreas: [frontendArea('apps/web')],
      });

      expect(result).toEqual([]);
    });

    it('ignores layer folders outside the backend area path', () => {
      const result = buildArchitectureSignals({
        entries: directories([
          'apps/frontend/src/controllers',
          'apps/frontend/src/services',
        ]),
        detectedAreas: [backendArea('apps/backend')],
      });

      expect(result).toEqual([]);
    });

    it('does not treat a sibling path that shares a prefix as inside the area', () => {
      const result = buildArchitectureSignals({
        entries: directories([
          'apps/api-gateway/src/routes',
          'apps/api-gateway/src/services',
        ]),
        detectedAreas: [backendArea('apps/api')],
      });

      expect(result).toEqual([]);
    });

    it('keeps only the qualifying parent when the area is at the root', () => {
      const result = buildArchitectureSignals({
        entries: directories([
          'src/controllers',
          'src/services',
          'client/services',
          'tests/fixtures/models',
        ]),
        detectedAreas: [backendArea('.')],
      });

      expect(result).toEqual([
        {
          signal: 'Layered backend',
          evidence: ['src/controllers', 'src/services'],
        },
      ]);
    });

    it('lists every qualifying parent inside one backend area', () => {
      const result = buildArchitectureSignals({
        entries: directories([
          'src/routes',
          'src/services',
          'lib/models',
          'lib/repositories',
        ]),
        detectedAreas: [backendArea('.')],
      });

      expect(result).toEqual([
        {
          signal: 'Layered backend',
          evidence: [
            'lib/models',
            'lib/repositories',
            'src/routes',
            'src/services',
          ],
        },
      ]);
    });

    describe('test folders', () => {
      it.each(['test', 'tests', 'spec'])(
        'ignores layer folders inside %s/',
        (testFolder) => {
          const result = buildArchitectureSignals({
            entries: directories([
              `${testFolder}/controllers`,
              `${testFolder}/services`,
            ]),
            detectedAreas: [backendArea('.')],
          });

          expect(result).toEqual([]);
        },
      );

      it('ignores test folders inside the backend area', () => {
        const result = buildArchitectureSignals({
          entries: directories([
            'apps/backend/tests/controllers',
            'apps/backend/tests/services',
          ]),
          detectedAreas: [backendArea('apps/backend')],
        });

        expect(result).toEqual([]);
      });

      it('keeps only the source folders when tests mirror the source tree', () => {
        const result = buildArchitectureSignals({
          entries: directories([
            'src/controllers',
            'src/services',
            'tests/controllers',
            'tests/services',
          ]),
          detectedAreas: [backendArea('.')],
        });

        expect(result).toEqual([
          {
            signal: 'Layered backend',
            evidence: ['src/controllers', 'src/services'],
          },
        ]);
      });
    });

    it('emits one entry with evidence from two backend areas', () => {
      const result = buildArchitectureSignals({
        entries: directories([
          'apps/api/src/routes',
          'apps/api/src/services',
          'apps/billing/src/controllers',
          'apps/billing/src/repositories',
        ]),
        detectedAreas: [backendArea('apps/api'), backendArea('apps/billing')],
      });

      expect(result).toEqual([
        {
          signal: 'Layered backend',
          evidence: [
            'apps/api/src/routes',
            'apps/api/src/services',
            'apps/billing/src/controllers',
            'apps/billing/src/repositories',
          ],
        },
      ]);
    });

    it('emits only for the backend area that has qualifying folders', () => {
      const result = buildArchitectureSignals({
        entries: directories([
          'apps/api/src/routes',
          'apps/api/src/services',
          'apps/worker/src/services',
        ]),
        detectedAreas: [backendArea('apps/api'), backendArea('apps/worker')],
      });

      expect(result).toEqual([
        {
          signal: 'Layered backend',
          evidence: ['apps/api/src/routes', 'apps/api/src/services'],
        },
      ]);
    });
  });

  describe('Client/server separation', () => {
    it('emits for a frontend and a backend in different folders', () => {
      const result = buildArchitectureSignals({
        entries: [],
        detectedAreas: [
          frontendArea('apps/frontend'),
          backendArea('apps/backend'),
        ],
      });

      expect(result).toEqual([
        {
          signal: 'Client/server separation',
          evidence: ['Express.js @ apps/backend', 'Next.js @ apps/frontend'],
        },
      ]);
    });

    it('emits for a mobile app and a backend in different folders', () => {
      const result = buildArchitectureSignals({
        entries: [],
        detectedAreas: [
          mobileArea('apps/mobile'),
          area({ name: 'Backend API', path: 'apps/api', primary: 'Django' }),
        ],
      });

      expect(result).toEqual([
        {
          signal: 'Client/server separation',
          evidence: ['Django @ apps/api', 'Flutter @ apps/mobile'],
        },
      ]);
    });

    it('emits when the backend is at the root and the client is in a subfolder', () => {
      const result = buildArchitectureSignals({
        entries: [],
        detectedAreas: [backendArea('.'), frontendArea('client')],
      });

      expect(result).toEqual([
        {
          signal: 'Client/server separation',
          evidence: ['Express.js @ .', 'Next.js @ client'],
        },
      ]);
    });

    it('emits one entry listing every client and server area', () => {
      const result = buildArchitectureSignals({
        entries: [],
        detectedAreas: [
          frontendArea('web'),
          frontendArea('admin'),
          backendArea('api'),
        ],
      });

      expect(result).toEqual([
        {
          signal: 'Client/server separation',
          evidence: [
            'Express.js @ api',
            'Next.js @ admin',
            'Next.js @ web',
          ],
        },
      ]);
    });

    it('does not emit when the client and server share an owner path', () => {
      const result = buildArchitectureSignals({
        entries: [],
        detectedAreas: [frontendArea('.'), backendArea('.')],
      });

      expect(result).toEqual([]);
    });

    it.each([
      ['only a frontend', [frontendArea('apps/frontend')]],
      ['only a backend', [backendArea('apps/backend')]],
      ['only a mobile app', [mobileArea('apps/mobile')]],
      [
        'two clients and no server',
        [frontendArea('apps/web'), mobileArea('apps/mobile')],
      ],
    ])('does not emit with %s', (_label, detectedAreas) => {
      const result = buildArchitectureSignals({ entries: [], detectedAreas });

      expect(result).toEqual([]);
    });

    it('ignores areas that are neither clients nor servers', () => {
      const result = buildArchitectureSignals({
        entries: [],
        detectedAreas: [
          backendArea('apps/backend'),
          area({
            name: 'Database schema',
            path: 'apps/db',
            primary: 'Prisma',
          }),
          area({
            name: 'Containerization',
            path: '.',
            primary: 'Docker',
          }),
          area({
            name: 'Documentation',
            path: 'docs',
            primary: 'Docusaurus',
          }),
        ],
      });

      expect(result).toEqual([]);
    });
  });

  describe('both signals together', () => {
    it('emits both signals for a layered Express backend beside a Next.js frontend', () => {
      const result = buildArchitectureSignals({
        entries: directories([
          'apps/backend/src/routes',
          'apps/backend/src/controllers',
          'apps/backend/src/services',
        ]),
        detectedAreas: [
          frontendArea('apps/frontend'),
          backendArea('apps/backend'),
        ],
      });

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        signal: 'Layered backend',
        evidence: [
          'apps/backend/src/controllers',
          'apps/backend/src/routes',
          'apps/backend/src/services',
        ],
      });
      expect(result).toContainEqual({
        signal: 'Client/server separation',
        evidence: ['Express.js @ apps/backend', 'Next.js @ apps/frontend'],
      });
    });

    it('emits Client/server separation without Layered backend when the backend has no layer folders', () => {
      const result = buildArchitectureSignals({
        entries: directories(['apps/backend/src/users']),
        detectedAreas: [
          frontendArea('apps/frontend'),
          backendArea('apps/backend'),
        ],
      });

      expect(result).toEqual([
        {
          signal: 'Client/server separation',
          evidence: ['Express.js @ apps/backend', 'Next.js @ apps/frontend'],
        },
      ]);
    });
  });
});
