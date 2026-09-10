# ADR 0004: Containerization Owner Resolution

- **Status:** Accepted
- **Date:** 2026-09-08
- **Domain:** `docs/architecture/github-analysis/project-structure/`
- **Related changelog entry:** [Containerization Owner Resolution via `resolveContainerRootOwner`](../changelog.md#containerization-owner-resolution-via-resolvecontainerrootowner)

---

## Context

Every detected area reports an owner path -- the root directory of one cohesive, independently deployable unit -- and downstream stages merge, deduplicate, and veto on it, so it must be deterministic for a given tree.

[ADR 0003](0003-pluggable-owner-adapters-anchor-signals.md) reintroduced bounded per-shape owner resolution as an `ownerAdapter` on the declarative engine, keyed on an **anchor signal**: a framework or tool config file that sits at the unit root by that tool's own contract. Its Decision paragraph, reaffirmed in the 2026-09-04 update, kept "Containerization ... detectors ... use the generic resolver only."

Two facts made that no longer tenable for Docker:

1. **Docker has no anchor.** A `Dockerfile` has no contract location -- `docker build -f` relocates it freely; `compose` and `bake` files are searched from the working directory, not a project root. There is no "config file at the unit root" to key on, so the anchor-signal mechanism does not apply.
2. **The generic resolver misgroups real repositories.** A recursive tree scan of 466 container-file paths across 36 well-known repositories (next.js, nx, turborepo, cal.com, immich, n8n, posthog, backstage, airflow, dagger, zitadel, budibase, langfuse, supabase, grafana, and more) showed:
   - `ownerPathForApplicationArea` recognised only `apps/` and `packages/`, but real deployable units also live under `libs/`, `services/`, `modules/`, `products/` (posthog), `plugins/` (backstage), `providers/` (airflow);
   - scoped npm packages (`packages/@n8n/benchmark`) collapsed to the bare scope folder `packages/@n8n`, merging independent units;
   - multi-image repos ship separate images from bare top-level directories (`server/`, `web/`, `worker/`, `machine-learning/` in immich and langfuse) and from a container file one directory below the root, all of which collapsed to `.` -- so a three-image repo produced one `Containerization` area.

Fixing all of this in the shared resolver for every detector is unsafe: `plugins/` and bare `server/`/`web/` directories also occur as plain source folders inside a single app, so unconditionally treating them as unit roots would over-split non-container detectors.

## Decision

Add a containerization-specific owner adapter, `resolveContainerRootOwner` (`detected-area-rules/owner-adapters/resolve-container-root-owner.ts`), and wire it onto the Docker detector as a **non-anchor** `ownerAdapter`. The Docker detector declares no `isAnchorSignal` schema, so the engine simply calls the adapter once per matched entry; `anchorOwners` stays empty. It resolves in three steps:

1. a path with no directory segment resolves to `.`;
2. a container file exactly one directory deep resolves to that directory -- unless the directory is in `NON_UNIT_TOP_LEVEL_DIRECTORIES`, a fixed denylist of infra, tooling, and workspace-container names (`docker`, `.devcontainer`, `.github`, `deploy`, `deployments`, `packaging`, `hosting`, `apps`, `packages`, `libs`, `services`, `modules`, ...), in which case it resolves to `.`;
3. otherwise it delegates to `ownerPathForApplicationArea`, passing `products`/`plugins`/`providers` as extra workspace roots for that call only.

The shared `ownerPathForApplicationArea` is also widened, because the same gaps degrade the anchored detectors' fallback path:

- the recognised workspace roots become an array -- `apps`, `packages`, `libs`, `services`, `modules` (a superset of `project-shape-detector.ts`'s roots);
- when the segment after a root is an npm scope (`@scope`), one extra path segment is kept (`packages/@n8n/benchmark`, not `packages/@n8n`);
- a new optional `extraRootDirectories` parameter lets one detector opt into additional roots without imposing them on every detector.

For any path two or more directories deep, `resolveContainerRootOwner` delegates unchanged, so monorepo units and infra trees resolve exactly as before. Podman/OCI is untouched and still uses the generic resolver only.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| Containerization-specific non-anchor adapter plus a widened generic resolver (selected) | Fixes multi-image and non-`apps`/`packages` repos; the heuristics sit in one small unit-tested file; the shared resolver gains only safe, widely-shared roots. Re-opens the "boundary-marker list" tradeoff ADR 0003 rejected -- but as a fixed, reviewed denylist, not an open-ended upward walk. |
| Keep the generic resolver only (ADR 0003 status quo) | No new surface, but immich/langfuse-style repos report one `Containerization` area for three images, and `plugins/`/`products/`/`providers/` units collapse to `.`. |
| Add every observed root (`products`, `plugins`, `providers`, bare units) to the shared `MONOREPO_OWNER_ROOT_DIRECTORIES` | One code path, but `plugins/` and bare `server/`/`web/` folders also occur inside single apps, so every non-container detector would over-split. |
| An anchor-signal adapter like `resolveUnitRootOwner` | Docker has no contract-located config file (`-f` relocates the Dockerfile; compose/bake are searched from the working directory), so there is no anchor to key on. |
| Manifest-aware detection (treat a directory as a unit only if it has its own `package.json` or build target) | Most accurate, but needs sibling-file lookup the adapter is not given today. Deferred. |

## Consequences

- Docker `Containerization` areas split per deployable unit in multi-image repos and attribute `products/`, `plugins/`, `providers/`, and scoped-package units to their real owner.
- This carves containerization out of ADR 0003's "generic resolver only" statement. ADR 0003's Decision paragraph and its "a future contributor must not consolidate ... into the generic resolver" consequence are amended (2026-09-08 update) to cover `resolveContainerRootOwner`.
- The one-directory-deep rule is a heuristic: it cannot tell immich's real `server/` unit from a plain `server/` source folder in a monolith that also has `client/`, so such a monolith resolves to two owners. Accepted as the "one image per folder" reading; revisit with manifest-awareness if false splits appear.
- `NON_UNIT_TOP_LEVEL_DIRECTORIES` is composed from the exported `MONOREPO_OWNER_ROOT_DIRECTORIES` (plus the containerization-only roots and infra folder names), so a new workspace root added there propagates automatically; both still need to be kept roughly in step with the roots in `project-shape-detector.ts`, which keeps its own deliberately narrower list.
- Known unresolved shape: a versioned nested sub-service (cal.com's `apps/api/v2`, deployed separately from `apps/api`) still collapses to `apps/api`; captured as an `it.fails` case in `resolve-container-root-owner.test.ts`.
- `resolveContainerRootOwner` has unit coverage (`resolve-container-root-owner.test.ts`, cases derived from the 36-repo scan). No analyzer-output fixture exercises the Docker detector's owner grouping end to end. Typecheck, lint, and tests were not run as part of this change.

## Update 2026-09-10: Adapter extended to the Podman/OCI detector

The Decision's final sentence -- "Podman/OCI is untouched and still uses the generic resolver only" -- is reversed. The Podman/OCI containerization detector now also passes `ownerAdapter: ({ path }) => resolveContainerRootOwner(path)` (no anchor schema), so both containerization detectors share the one adapter. `resolveContainerRootOwner` gained a Podman/OCI arm alongside the Docker one:

- `PODMAN_OCI_CONTAINER_FILE_NAME` -- Quadlet unit extensions (`.container`, `.pod`, `.kube`, `.build`, `.image`, `.network`, `.volume`, `.artifact`), `Containerfile` and suffixed variants, `.containerignore` -- is the Podman/OCI counterpart to `CONTAINER_FILE_NAME` for the two-segment rule.
- `PODMAN_OCI_NON_UNIT_TOP_LEVEL_DIRECTORIES` widens `NON_UNIT_TOP_LEVEL_DIRECTORIES` with `systemd`, `containers`, `.quadlet`, `quadlet`, `quadlets`, `kube`, `sysadmin` -- the folders that hold Quadlet/OCI files for deployment or host administration (`.../containers/systemd/` mirrors), not for a unit named after the folder.
- `quadlet` and `quadlets` join `CONTAINER_DEPLOYMENT_ROOT_DIRECTORIES`, so they are collection roots for a service subdirectory (`quadlet/<svc>/<svc>.container` -> `quadlet/<svc>`) and, via the `NON_UNIT_TOP_LEVEL_DIRECTORIES` spread, non-unit holders for a file sitting directly inside -- the dual role `apps/` has.

Deliberately **not** done: making `containers/` a collection root. `containers/<name>/Containerfile` is a real self-contained build-context shape, but `containers/` is more often the `containers/systemd/` Quadlet-search-path mirror (must resolve to `.`) or a loose holder, and the module's rules are name-only with no "root unless the child is `systemd`" carve-out. `containers/` stays purely on the denylist; `containers/ldap/Containerfile -> .` is an accepted loss, pinned as an `it.fails` case in `resolve-container-root-owner.podman-oci.test.ts`.

The "a future contributor must not consolidate this adapter into the generic resolver" consequence now covers the Podman/OCI detector too.

See [Podman/OCI Containerization Owner Resolution via `resolveContainerRootOwner`](../changelog.md#podmanoci-containerization-owner-resolution-via-resolvecontainerrootowner) (2026-09-10).

## References

- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-container-root-owner.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-container-root-owner.test.ts`
- `apps/backend/src/services/github-analysis/project-structure/project-structure-path-utils.ts` (`ownerPathForApplicationArea`, `MONOREPO_OWNER_ROOT_DIRECTORIES`)
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/docker-containerization-area-rules.ts`
- [ADR 0003: Pluggable Owner Adapters with Anchor Signals](0003-pluggable-owner-adapters-anchor-signals.md)
- [ADR 0001: Docker Containerization Gate](0001-docker-containerization-gate.md)
