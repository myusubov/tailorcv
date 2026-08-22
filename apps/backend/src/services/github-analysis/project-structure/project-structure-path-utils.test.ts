import { describe, expect, it } from 'vitest';

import {
  ownerPathForDockerContainerizationArea,
  ownerPathForPodmanOciContainerizationArea,
} from './project-structure-path-utils';

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
      ['apps/Dockerfile', 'apps'],
      ['services/compose.yml', 'services'],
      ['packages/docker-bake.hcl', 'packages'],
      ['libs/.dockerignore', 'libs'],
    ])(
      'returns monorepo root for direct Docker evidence %s',
      (path, expectedOwnerPath) => {
        expect(ownerPathForDockerContainerizationArea(path)).toBe(
          expectedOwnerPath,
        );
      },
    );

    it.each([
      ['apps/docker/Dockerfile', 'apps'],
      ['apps/.devcontainer/devcontainer.json', 'apps'],
      ['services/deploy/docker-compose.yml', 'services'],
      ['packages/ops/docker-bake.hcl', 'packages'],
    ])(
      'returns monorepo root for Docker config directory evidence %s',
      (path, expectedOwnerPath) => {
        expect(ownerPathForDockerContainerizationArea(path)).toBe(
          expectedOwnerPath,
        );
      },
    );

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

  describe('ownerPathForPodmanOciContainerizationArea', () => {
    it.each([
      ['apps/api/api.container', 'apps/api'],
      ['apps/api/quadlet/api.container', 'apps/api'],
      ['services/worker/worker.pod', 'services/worker'],
      ['packages/backend/Containerfile', 'packages/backend'],
      ['libs/api/.containerignore', 'libs/api'],
    ])('returns monorepo owner for %s', (path, expectedOwnerPath) => {
      expect(ownerPathForPodmanOciContainerizationArea(path)).toBe(
        expectedOwnerPath,
      );
    });

    it.each([
      ['apps/api.container', 'apps'],
      ['services/worker.pod', 'services'],
      ['packages/Containerfile', 'packages'],
    ])(
      'returns monorepo root for direct Podman/OCI evidence %s',
      (path, expectedOwnerPath) => {
        expect(ownerPathForPodmanOciContainerizationArea(path)).toBe(
          expectedOwnerPath,
        );
      },
    );

    it.each([
      ['apps/quadlet/api.container', 'apps'],
      ['services/deploy/worker.pod', 'services'],
      ['packages/containers/api.container', 'packages'],
    ])(
      'returns monorepo root for Podman config directory evidence %s',
      (path, expectedOwnerPath) => {
        expect(ownerPathForPodmanOciContainerizationArea(path)).toBe(
          expectedOwnerPath,
        );
      },
    );

    it.each([
      ['api.container', '.'],
      ['Containerfile', '.'],
      ['.containerignore', '.'],
      ['quadlet/api.container', '.'],
      ['containers/api.container', '.'],
      ['deploy/quadlet/api.container', '.'],
      ['etc/containers/systemd/api.container', '.'],
    ])('returns root owner for repo-level config path %s', (path, expected) => {
      expect(ownerPathForPodmanOciContainerizationArea(path)).toBe(expected);
    });

    it.each([
      [
        'subsystems/video/etc/containers/systemd/rear-camera.container',
        'subsystems/video',
      ],
      ['tools/quadlet/oikos.container', 'tools'],
    ])(
      'collapses a generic config directory anywhere in the path to its owning component for %s',
      (path, expected) => {
        expect(ownerPathForPodmanOciContainerizationArea(path)).toBe(
          expected,
        );
      },
    );

    it.each([
      ['backend/api.container', 'backend'],
      ['api/worker.pod', 'api'],
      ['experimental/podman-systemd/misp-core.container', 'experimental/podman-systemd'],
    ])(
      'falls back to parent owner for local area path %s',
      (path, expected) => {
        expect(ownerPathForPodmanOciContainerizationArea(path)).toBe(
          expected,
        );
      },
    );
  });
});
