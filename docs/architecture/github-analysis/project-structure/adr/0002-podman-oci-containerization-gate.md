# ADR 0002: Podman/OCI Containerization Gate

- **Status:** Accepted
- **Date:** 2026-07-22
- **Domain:** `docs/architecture/github-analysis/project-structure/`
- **Related changelog entry:** [Podman/OCI Conservative Combination Gate](../changelog.md#podmanoci-conservative-combination-gate)

---

## Context

The project-structure analyzer identifies Podman/OCI containerization from repository paths without reading file contents. Podman Quadlet uses `.container`, `.pod`, `.kube`, `.build`, `.image`, `.network`, `.volume`, and `.artifact` units, while OCI builds may use `Containerfile` and `.containerignore`. These basenames are meaningful in a real Quadlet deployment but are not globally unique: extensions such as `.build`, `.container`, `.image`, and `.network` can belong to unrelated formats, and generic OCI build files do not identify Podman on their own.

The gate therefore needs stronger corroboration than the Docker detector. Dockerfile, Compose, and Bake names directly identify their workflows, while the Podman detector sees only ambiguous unit extensions and cannot validate required Quadlet sections such as `[Container]` or `[Build]`.

## Decision

No individual Podman/OCI path signal independently unlocks `Containerization` emission.

A runtime definition (`.container`, `.pod`, or `.kube`) qualifies only when the same resolved owner also has another runtime definition, a Quadlet build/image/network/volume/artifact unit, or a `Containerfile`.

A `.build` unit qualifies only when the same owner also has a `Containerfile`, runtime definition, or `.image` unit. Network, volume, and artifact units cannot corroborate `.build` by themselves because that combination could join unrelated generic extensions without establishing an OCI image-build chain.

`.containerignore` is always support-only. It may contribute score and evidence after another combination passes, but it never participates in an emission combination. Resource-only groups and generic `Containerfile` plus `.containerignore` shapes also remain non-emitting.

Core `.container`, `.pod`, `.kube`, and `.build` signals score `3`; `.image` scores `2`; network, volume, artifact, `Containerfile`, and `.containerignore` signals score `1`. These values express confidence after gate qualification and do not act as an alternative score-threshold gate.

## Considered Options

| Option                                                            | Tradeoff                                                                                                              |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Require coherent runtime/build combinations                       | Reduces basename-collision false positives while recognizing common multi-file Quadlet layouts; selected.             |
| Let `.container`, `.pod`, `.kube`, or `.build` emit independently | Preserves valid single-unit repositories but incorrectly assumes every matching extension is a verified Quadlet file. |
| Allow any signals whose total reaches the shared score threshold  | Simple, but support-only or unrelated extensions can accumulate into Podman attribution without a coherent workflow.  |
| Require a fixed `quadlet/` or `containers/systemd/` directory     | Adds path context but rejects valid root-level and custom deployment layouts observed in real repositories.           |

## Consequences

- Single-file Quadlet repositories are intentionally conservative false negatives until content analysis can confirm their unit sections.
- Common multi-file runtime shapes such as container plus pod/network/volume and build shapes such as build plus Containerfile can emit Podman/OCI containerization.
- Generic OCI evidence never attributes Podman without a qualifying Quadlet core unit.
- Signal scores improve confidence only for a gate-qualified owner.
- Podman-specific owner resolution and exclusions for test, fixture, example, and documentation paths remain required follow-up work.

## References

- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/podman-oci-containerization-area-rules.ts`
- `apps/backend/src/services/github-analysis/project-structure/project-structure-analyzer.test.ts`
- [Podman Quadlet unit documentation](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
- [Podman build documentation](https://docs.podman.io/en/stable/markdown/podman-build.1.html)
