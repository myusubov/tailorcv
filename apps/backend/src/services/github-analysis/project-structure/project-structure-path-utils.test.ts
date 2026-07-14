import { describe, expect, it } from 'vitest';

import { ownerPathForDockerContainerizationArea } from './project-structure-path-utils';

describe('project structure path utils', () => {
  describe('ownerPathForDockerContainerizationArea', () => {
    it.each([
      ['apps/api/Dockerfile', 'apps/api'],
      ['apps/api/docker/Dockerfile', 'apps/api'],
      ['services/worker/compose.yml', 'services/worker'],
      ['packages/backend/docker-bake.hcl', 'packages/backend'],
      ['libs/api/.dockerignore', 'libs/api'],
    ])('returns monorepo owner for %s', (path, expectedOwnerPath) => {
      expect(ownerPathForDockerContainerizationArea(path)).toBe(
        expectedOwnerPath,
      );
    });

    it.each([
      ['Dockerfile', '.'],
      ['docker-compose.yml', '.'],
      ['docker-bake.hcl', '.'],
      ['.dockerignore', '.'],
      ['docker/Dockerfile', '.'],
      ['deploy/docker/Dockerfile', '.'],
      ['.devcontainer/devcontainer.json', '.'],
    ])('returns root owner for repo-level config path %s', (path, expected) => {
      expect(ownerPathForDockerContainerizationArea(path)).toBe(expected);
    });

    it.each([
      ['backend/Dockerfile', 'backend'],
      ['api/docker-compose.yml', 'api'],
      ['worker/docker-bake.override.hcl', 'worker'],
    ])(
      'falls back to parent owner for local area path %s',
      (path, expected) => {
        expect(ownerPathForDockerContainerizationArea(path)).toBe(expected);
      },
    );
  });
});
