import { resolveContainerRootOwner } from './resolve-container-root-owner';
import { describe, it, expect } from 'vitest';

/**
 * Owner-resolution spec for Podman / OCI containerization signals, asserted
 * against `resolveContainerRootOwner`.
 *
 * Every case asserts the owner the deployable unit resolves to. All are plain
 * assertions except one `it.fails` that pins a known, accepted gap
 * (`containers/ldap/Containerfile`, see the judgment-calls block). A red case
 * marks a regression in the Podman/OCI branch of `resolveContainerRootOwner`,
 * which the Podman/OCI detector keys its candidates by (`ownerAdapter` in
 * `podman-oci-containerization-area-rules.ts`).
 *
 * Paths are lifted verbatim from real repositories:
 * - flat homelab quadlet trees: `fpatrick/podman-quadlet`,
 *   `herzenschein/herz-quadlet`, `TheQuantumPhysicist/example-podman-quadlet`,
 *   `dexterdy/my-server-configs`
 * - quadlet collection directories: `containers/appstore`,
 *   `cryinkfly/podman-rootless-quadlets`
 * - committed `containers/systemd/` and `systemd/` source directories:
 *   `openSUSE/qem-dashboard`, `jfroy/etincelle`, `Dolfost/dotfiles`,
 *   `InsForge/insforge-standalone`, `oats-center/Avena-Build-Guide`,
 *   `Metron-Project/metron`, `aeger/traefik-rootless`, `mareklibra/memgrow`,
 *   `adamszegedi/dotfiles`
 * - OCI Containerfile builds: `containers/image_build`,
 *   `coreos/fedora-coreos-config`, `ublue-os/main`, `containers/podman`,
 *   `elaverick/homelab`
 * - single-app quadlet wrappers: `SinTan1729/chhoto-url`, `moinwiki/moin`,
 *   `Gamocosm/Gamocosm`, `xyproto/algernon`, `OpenEnergyPlatform/oeplatform`,
 *   `BlankOn/irgsh-go`, `FNNDSC/miniChRIS-podman`, `tprrt/llm-companion`,
 *   `witch-house/pronoun.is`, `lerd-env/lerd`,
 *   `jaquiteme/container-engine-actions-runner-controller`
 *
 * Patterns from the scan that shape `resolveContainerRootOwner`:
 * 1. The dominant Podman shape is `<service>/<service>.container` (plus its
 *    `.pod` / `.network` / `.volume` / `.kube` siblings) exactly one directory
 *    below the repo root, where `<service>` is the deployable unit. The
 *    `PODMAN_OCI_CONTAINER_FILE_NAME` regex matches Quadlet unit extensions
 *    and `Containerfile`, so the one-directory-deep rule attributes each such
 *    path to its service directory rather than collapsing a multi-service
 *    homelab repo to a single `.` area.
 * 2. `quadlet/` and `quadlets/` behave like `apps/`: `quadlet/<svc>/<file>`
 *    resolves to `quadlet/<svc>`, while a file sitting directly in the
 *    collection folder has no unit and resolves to `.`.
 * 3. The committed `containers/systemd/`, `systemd/`, `.config/containers/
 *    systemd/`, `.quadlet/` locations are a deployment target, not a unit, so
 *    `systemd`, `.quadlet`, `quadlet`, `quadlets`, `kube`, `sysadmin`, and
 *    `containers` are in `PODMAN_OCI_NON_UNIT_TOP_LEVEL_DIRECTORIES` and keep
 *    the two-segment case at `.`.
 * 4. `Containerfile` / `.containerignore` are Dockerfile-equivalent and
 *    resolve identically; `PODMAN_OCI_CONTAINER_FILE_NAME` recognises them.
 */
describe('resolveContainerRootOwner - Podman / OCI signals', () => {
  describe('single-service repo: unit files at the repo root -> "."', () => {
    it.each([
      'Containerfile',
      'Containerfile.cross',
      '.containerignore',
      'pronoun.is.container',
      'app.container',
      'app.pod',
      'app.network',
      'app.volume',
      'app.image',
      'app.kube',
      'app.build',
      'app.artifact',
    ])('%s -> .', (path) => {
      expect(resolveContainerRootOwner(path)).toBe('.');
    });
  });

  describe('committed Quadlet source directories are a deploy target, not a unit -> "."', () => {
    it.each([
      'containers/systemd/gitea.container',
      'containers/systemd/qem-dashboard.container',
      'containers/systemd/qem-dashboard.build',
      'containers/systemd/qem.pod',
      'containers/systemd/postgres.container',
      'containers/systemd/nats.volume',
      'containers/systemd/avena.network',
      'systemd/insforge.container',
      'systemd/insforge-postgres.container',
      'systemd/insforge.network',
      'systemd/traefik.container',
      'systemd/memgrow-db.container',
      '.config/containers/systemd/syncthing.container',
      'dot_config/containers/systemd/syncthing.kube',
    ])('%s -> .', (path) => {
      expect(resolveContainerRootOwner(path)).toBe('.');
    });
  });

  describe('single-app quadlet wrapper folders -> "."', () => {
    it.each([
      '.quadlet/metron-redis.container',
      '.quadlet/metron.network',
      'podman/quadlets/oep-ontop.container',
      'podman/quadlet/minichris.kube',
      'utils/quadlets/irgsh-chief.container',
      'embed/quadlet/lerd-minio.container',
      'deploy/chhoto-url.container',
      'deploy/quadlet/ce-arc-server.kube',
      'contrib/podman/moin.container',
      'sysadmin/gamocosm-puma.container',
      'docs/examples/podman/protonwire.container',
      'containers/algernon.container',
      'kube/llm-companion.kube',
    ])('%s -> .', (path) => {
      expect(resolveContainerRootOwner(path)).toBe('.');
    });
  });

  describe('flat homelab layout: the service directory owns its unit files', () => {
    it.each([
      ['n8n/n8n.container', 'n8n'],
      ['immich/immich-server.container', 'immich'],
      ['immich/immich.pod', 'immich'],
      ['immich/immich-db.container', 'immich'],
      ['searxng/searxng.pod', 'searxng'],
      ['plex/plex.container', 'plex'],
      ['caddy/caddy.container', 'caddy'],
      ['caddy/caddy.network', 'caddy'],
      ['gitlab/gitlab.container', 'gitlab'],
      ['gitlab/gitlab.network', 'gitlab'],
      ['mediawiki/mediawiki-db.container', 'mediawiki'],
      ['nextcloud/nextcloud.kube', 'nextcloud'],
      ['vaultwarden/vaultwarden.kube', 'vaultwarden'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveContainerRootOwner(path)).toBe(owner);
    });
  });

  describe('quadlet collection roots: the service subdirectory is the unit', () => {
    it.each([
      ['quadlet/valkey/valkey.container', 'quadlet/valkey'],
      ['quadlet/splunk/splunk.container', 'quadlet/splunk'],
      ['quadlet/ai-stack/ollama.pod', 'quadlet/ai-stack'],
      ['quadlet/ai-stack/ollama.network', 'quadlet/ai-stack'],
      ['quadlet/ai-stack/valkey.volume', 'quadlet/ai-stack'],
      ['quadlet/bluesky_pds/caddy.container', 'quadlet/bluesky_pds'],
      ['quadlet/inlets-ghost/inlets-ghost.kube', 'quadlet/inlets-ghost'],
      ['quadlets/vaultwarden/vaultwarden.container', 'quadlets/vaultwarden'],
      [
        'quadlets/opencloud-full/opencloud-server.container',
        'quadlets/opencloud-full',
      ],
      [
        'quadlets/nginx-proxy-manager/proxy.network',
        'quadlets/nginx-proxy-manager',
      ],
    ])('%s -> %s', (path, owner) => {
      expect(resolveContainerRootOwner(path)).toBe(owner);
    });
  });

  describe('a deeper subdirectory under a unit does not move ownership', () => {
    it('quadlets/filebrowser-quantum/radicale/filebrowser-quantum-radicale.container -> quadlets/filebrowser-quantum', () => {
      expect(
        resolveContainerRootOwner(
          'quadlets/filebrowser-quantum/radicale/filebrowser-quantum-radicale.container',
        ),
      ).toBe('quadlets/filebrowser-quantum');
    });
  });

  describe('OCI Containerfile build directories own their image', () => {
    it.each([
      ['buildah/Containerfile', 'buildah'],
      ['podman/Containerfile', 'podman'],
      ['skopeo/Containerfile', 'skopeo'],
      ['aio/Containerfile', 'aio'],
      ['caddy/Containerfile', 'caddy'],
      ['openbao-snapshot/Containerfile', 'openbao-snapshot'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveContainerRootOwner(path)).toBe(owner);
    });
  });

  describe('OCI Containerfile at the root or in infra folders -> "."', () => {
    it.each([
      '.devcontainer/Containerfile',
      'container/devel/Containerfile',
      'contrib/hello/Containerfile',
      'contrib/validatepr/Containerfile',
      'docs/Containerfile',
      'test/compose/images/podman-python/Containerfile',
      'test/e2e/build/basicalpine/Containerfile',
      'pkg/bindings/test/fixture/Containerfile',
    ])('%s -> .', (path) => {
      expect(resolveContainerRootOwner(path)).toBe('.');
    });
  });

  describe('monorepo workspace units still resolve normally (regression guard)', () => {
    it.each([
      ['apps/api/Containerfile', 'apps/api'],
      ['apps/web/web.container', 'apps/web'],
      ['packages/server/.containerignore', 'packages/server'],
      ['packages/worker/worker.build', 'packages/worker'],
      ['services/mcp/mcp.container', 'services/mcp'],
      ['libs/dal/dal.pod', 'libs/dal'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveContainerRootOwner(path)).toBe(owner);
    });
  });

  describe('judgment calls', () => {
    it('apps/pod.container -> "." (unit file directly under a workspace root)', () => {
      expect(resolveContainerRootOwner('apps/pod.container')).toBe('.');
    });

    it.fails(
      'containers/ldap/Containerfile -> containers/ldap (self-contained image build context)',
      () => {
        expect(resolveContainerRootOwner('containers/ldap/Containerfile')).toBe(
          'containers/ldap',
        );
      },
    );

    it('agents/openclaw/edge/openclaw-agent.kube -> "." ("agents" is not a known unit root)', () => {
      expect(
        resolveContainerRootOwner('agents/openclaw/edge/openclaw-agent.kube'),
      ).toBe('.');
    });

    it('418-home/ha/pod.kube -> "." (per-host directory, not a unit root)', () => {
      expect(resolveContainerRootOwner('418-home/ha/pod.kube')).toBe('.');
    });

    it('pods/kube-yaml/github-runner-oracle.kube -> "." (kube-yaml holding dir, not a unit)', () => {
      expect(
        resolveContainerRootOwner('pods/kube-yaml/github-runner-oracle.kube'),
      ).toBe('.');
    });
  });
});
