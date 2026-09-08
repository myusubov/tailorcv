import { resolveContainerRootOwner } from './resolve-container-root-owner';
import { describe, it, expect } from 'vitest';

/**
 * Owner-resolution spec for Docker containerization signals.
 *
 * Cases are taken from recursive tree scans of 36 real repositories
 * (next.js, nx, turborepo, cal.com, immich, n8n, astro, posthog, medusa,
 * strapi, directus, twenty, documenso, formbricks, novu, plane, coolify,
 * gitea, hoppscotch, supabase, grafana, excalidraw, memos, backstage, expo,
 * workers-sdk, airflow, dagger, zitadel, nocodb, budibase, appsmith,
 * langfuse, kibana, temporal, appwrite). Each `describe` names the shape; the
 * expected owner is the deployable unit the container files belong to.
 *
 * Finding from the scan: across 466 container-file paths, `Dockerfile`,
 * `compose`, `.dockerignore`, `docker-bake`, and `devcontainer.json` cluster
 * either (a) at the repo root, (b) directly under a workspace unit, or
 * (c) inside an infra / tooling / dev-env folder that has no owning unit.
 * `ownerPathForApplicationArea` alone already resolves (a) and (c) to `.` and
 * (b) to the unit -- no `.dockerignore`/`.devcontainer` marker branch and no
 * wrapper-folder peel was needed by any real path (there was not a single
 * `<wrapper>/src/...` or `<wrapper>/<workspace-root>/...` container path).
 *
 * The trailing `describe` blocks are the gaps the scan surfaced. Scoped
 * packages, unrecognized workspace roots (`products`/`plugins`/`providers`),
 * and bare top-level unit directories are now handled -- in the shared
 * resolver (`@scope` depth) and this adapter (extra roots, one-directory-deep
 * rule with an infra-folder guard). Versioned sub-services (`apps/api/v2`) are
 * the one remaining gap: that case asserts the owner the unit *should* have
 * and FAILS today, documenting required work rather than a regression.
 */
describe('resolveContainerRootOwner', () => {
  describe('single-app repo: container files at the root -> "."', () => {
    it.each([
      'Dockerfile',
      'Dockerfile.dev',
      'Dockerfile.ci',
      'Dockerfile.rootless',
      'prod.Dockerfile',
      'compose.yaml',
      'docker-compose.yml',
      'docker-compose.prod.yml',
      'docker-compose.override.yml',
      'docker-bake.hcl',
      '.dockerignore',
    ])('%s -> .', (path) => {
      expect(resolveContainerRootOwner(path)).toBe('.');
    });
  });

  describe('monorepo: the workspace unit owns its container files', () => {
    it.each([
      ['apps/api/Dockerfile', 'apps/api'],
      ['apps/login/Dockerfile.fips', 'apps/login'],
      ['apps/web/Dockerfile.web', 'apps/web'],
      ['apps/api/Dockerfile.dev', 'apps/api'],
      ['apps/admin/.dockerignore', 'apps/admin'],
      ['apps/dashboard/dockerfile', 'apps/dashboard'],
      ['apps/api/v2/docker-compose.yaml', 'apps/api'],
      ['apps/web/test/docker-compose.yml', 'apps/web'],
      ['packages/backend/Dockerfile', 'packages/backend'],
      ['packages/server/Dockerfile', 'packages/server'],
      ['packages/worker/.dockerignore', 'packages/worker'],
      ['packages/hoppscotch-backend/Dockerfile', 'packages/hoppscotch-backend'],
      ['packages/cli/Dockerfile', 'packages/cli'],
      ['packages/twenty-docker/twenty/Dockerfile', 'packages/twenty-docker'],
      ['packages/pg-meta/test/db/Dockerfile', 'packages/pg-meta'],
      ['libs/dal/.dockerignore', 'libs/dal'],
      ['services/mcp/Dockerfile', 'services/mcp'],
      ['services/agent-proxy/Dockerfile', 'services/agent-proxy'],
      ['modules/ruff/build/Dockerfile', 'modules/ruff'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveContainerRootOwner(path)).toBe(owner);
    });
  });

  describe('a deep subdir under a workspace unit does not move ownership', () => {
    it.each([
      [
        'packages/server/scripts/integrations/mysql/data/Dockerfile',
        'packages/server',
      ],
      [
        'packages/create-app/templates/legacy-app/packages/backend/Dockerfile',
        'packages/create-app',
      ],
      [
        'packages/testing/containers/dockerfiles/kent/Dockerfile',
        'packages/testing',
      ],
    ])('%s -> %s', (path, owner) => {
      expect(resolveContainerRootOwner(path)).toBe(owner);
    });
  });

  describe('infra / tooling / dev-env folders have no owning unit -> "."', () => {
    it.each([
      ['docker/Dockerfile', '.'],
      ['docker/Dockerfile.chromium', '.'],
      ['docker/docker-compose.yml', '.'],
      ['docker/docker-compose.prod.yml', '.'],
      ['docker/docker-bake.hcl', '.'],
      ['docker/community/docker-compose.yml', '.'],
      ['docker/images/n8n/Dockerfile', '.'],
      ['docker/production/Dockerfile', '.'],
      ['deployments/aio/community/Dockerfile', '.'],
      ['packaging/docker/custom/Dockerfile', '.'],
      ['hosting/docker-compose.yaml', '.'],
      ['devenv/docker/blocks/mysql/docker-compose.yaml', '.'],
      ['.github/next-stats-action.Dockerfile', '.'],
      ['.github/actions/next-stats-action/Dockerfile', '.'],
      ['contrib/docker/frontend-with-nginx/Dockerfile.dockerbuild', '.'],
      ['tests/resources/docker/docker-compose.yml', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveContainerRootOwner(path)).toBe(owner);
    });
  });

  describe('.devcontainer files resolve to their enclosing unit (usually "."), no marker branch needed', () => {
    it.each([
      ['.devcontainer/devcontainer.json', '.'],
      ['.devcontainer/Dockerfile', '.'],
      ['.devcontainer/docker-compose.yml', '.'],
      ['.devcontainer/codespaces/Dockerfile', '.'],
      ['.devcontainer/codespaces/devcontainer.json', '.'],
      ['.devcontainer/framework-react/devcontainer.json', '.'],
      ['.devcontainer/preview/Dockerfile', '.'],
      ['.devcontainer/examples.Dockerfile', '.'],
      ['apps/web/.devcontainer/devcontainer.json', 'apps/web'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveContainerRootOwner(path)).toBe(owner);
    });
  });

  describe('scoped workspace packages (@scope/name) are owned by the scoped package, not the scope folder', () => {
    it('packages/@n8n/benchmark/Dockerfile -> packages/@n8n/benchmark', () => {
      expect(
        resolveContainerRootOwner('packages/@n8n/benchmark/Dockerfile'),
      ).toBe('packages/@n8n/benchmark');
    });
    it('packages/@n8n/engine/.dockerignore -> packages/@n8n/engine', () => {
      expect(
        resolveContainerRootOwner('packages/@n8n/engine/.dockerignore'),
      ).toBe('packages/@n8n/engine');
    });
  });

  describe('workspace roots seen in real monorepos but not yet recognized', () => {
    it('products/metrics/agent/Dockerfile -> products/metrics (posthog)', () => {
      expect(
        resolveContainerRootOwner('products/metrics/agent/Dockerfile'),
      ).toBe('products/metrics');
    });
    it('plugins/scaffolder-backend-module-rails/Rails.dockerfile -> plugins/scaffolder-backend-module-rails (backstage)', () => {
      expect(
        resolveContainerRootOwner(
          'plugins/scaffolder-backend-module-rails/Rails.dockerfile',
        ),
      ).toBe('plugins/scaffolder-backend-module-rails');
    });
    it('providers/informatica/dev/informatica_simulator/Dockerfile -> providers/informatica (airflow)', () => {
      expect(
        resolveContainerRootOwner(
          'providers/informatica/dev/informatica_simulator/Dockerfile',
        ),
      ).toBe('providers/informatica');
    });
  });

  describe('bare top-level unit directories own their container files', () => {
    it.each([
      ['server/Dockerfile', 'server'],
      ['web/Dockerfile', 'web'],
      ['worker/Dockerfile', 'worker'],
      ['machine-learning/Dockerfile', 'machine-learning'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveContainerRootOwner(path)).toBe(owner);
    });
  });

  describe('judgment calls', () => {
    it.fails('apps/api/v2/Dockerfile -> apps/api/v2 (cal.com)', () => {
      expect(resolveContainerRootOwner('apps/api/v2/Dockerfile')).toBe(
        'apps/api/v2',
      );
    });

    it('examples/with-docker/apps/api/Dockerfile -> "." (turborepo)', () => {
      expect(
        resolveContainerRootOwner('examples/with-docker/apps/api/Dockerfile'),
      ).toBe('.');
    });

    it('app/client/Dockerfile -> "." ; "app" must not become a workspace root (appsmith)', () => {
      expect(resolveContainerRootOwner('app/client/Dockerfile')).toBe('.');
    });

    it('apps/build/Dockerfile -> apps/build', () => {
      expect(resolveContainerRootOwner('apps/build/Dockerfile')).toBe(
        'apps/build',
      );
    });

    it('apps/dockerfile -> "." (file directly under a workspace root)', () => {
      expect(resolveContainerRootOwner('apps/dockerfile')).toBe('.');
    });
  });
});
