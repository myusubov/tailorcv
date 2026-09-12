# GitHub Project Structure Analyzer ADRs

Architecture Decision Records for this domain.

Add an ADR only when the decision is durable enough that future contributors should not accidentally reverse it.

- [0001: Docker Containerization Gate](0001-docker-containerization-gate.md) — Defines decisive and support-only Docker path signals for area emission.
- [0002: Podman/OCI Containerization Gate](0002-podman-oci-containerization-gate.md) — Requires coherent multi-signal Podman/OCI path shapes before area emission.
- [0003: Pluggable Owner Adapters with Anchor Signals](0003-pluggable-owner-adapters-anchor-signals.md) — Owner resolution is a pluggable per-shape concern via anchor signals and a two-pass engine; the generic resolver stays the default and fallback. (2026-09-11 update: extended to Jenkins, whose `Jenkinsfile` anchors at any depth rather than a fixed unit root. 2026-09-12 update: extended to Expo, whose `app/_layout` anchor sits below the unit root and needs a dedicated stripping rule, plus a per-call `extraRootDirectories` override.)
- [0004: Containerization Owner Resolution](0004-containerization-owner-resolution.md) — The Docker and Podman/OCI detectors get a non-anchor owner adapter (`resolveContainerRootOwner`) with an infra-folder denylist and a one-directory-deep rule; the shared generic resolver is widened alongside it. (2026-09-10 update: extended to Podman/OCI with a Quadlet basename matcher and denylist.)
