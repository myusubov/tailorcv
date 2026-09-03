# ADR 0001: Docker Containerization Gate

- **Status:** Accepted
- **Date:** 2026-07-16
- **Domain:** `docs/architecture/github-analysis/project-structure/`
- **Related changelog entry:** [Docker Containerization Emission Gate](../changelog.md#docker-containerization-emission-gate)

---

## Context

The project-structure analyzer must decide whether path-only Docker evidence is strong enough to emit a `Containerization` area. Dockerfile, Compose, Bake, `.dockerignore`, and devcontainer paths have different semantics. Requiring combinations of strong signals would reject common valid repositories, while allowing any accumulated signal score to emit would promote support-only development/configuration files into application containerization claims.

## Decision

A Dockerfile, Compose file, or Docker Bake file independently unlocks Docker `Containerization` emission for its resolved owner. Each is a Docker-specific definition of an image build, container-backed application runtime, or Buildx build workflow.

`.dockerignore` and `.devcontainer/devcontainer.json` are support-only signals. They may increase score and contribute evidence after the same owner has a decisive signal, but neither can unlock emission alone, and their combination cannot unlock emission. The gate remains path-only and does not inspect configuration contents.

## Considered Options

| Option                                                               | Tradeoff                                                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent Dockerfile, Compose, and Bake anchors                    | Preserves common single-file Docker repository shapes while rejecting support-only evidence; selected.                                            |
| Require Dockerfile plus Compose or other combinations                | Maximizes corroboration but creates false negatives for Dockerfile-only images, Compose services using published images, and Bake-defined builds. |
| Allow any signal combination that reaches the shared score threshold | Simple, but `.dockerignore` plus devcontainer configuration can emit without an application build or runtime definition.                          |

## Consequences

- Common Dockerfile-only, Compose-only, and Bake-only repositories can emit containerization areas.
- Support files improve evidence and confidence only after decisive proof exists.
- Development-container-only repositories do not emit application containerization areas.
- The analyzer cannot verify file contents or distinguish stale path artifacts; later dependency/config analysis remains responsible for deeper confirmation.

## References

- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/containerization/docker-containerization-area-rules.ts`
- [Dockerfile overview](https://docs.docker.com/build/concepts/dockerfile/)
- [Compose file reference](https://docs.docker.com/reference/compose-file/)
- [Docker Bake reference](https://docs.docker.com/build/bake/reference/)
- [Docker build context and `.dockerignore`](https://docs.docker.com/build/concepts/context/)
- [Development Containers: Images, Dockerfiles, and Compose](https://containers.dev/guide/dockerfile)
