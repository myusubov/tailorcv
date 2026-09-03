# GitHub Project Structure Analyzer ADRs

Architecture Decision Records for this domain.

Add an ADR only when the decision is durable enough that future contributors should not accidentally reverse it.

- [0001: Docker Containerization Gate](0001-docker-containerization-gate.md) — Defines decisive and support-only Docker path signals for area emission.
- [0002: Podman/OCI Containerization Gate](0002-podman-oci-containerization-gate.md) — Requires coherent multi-signal Podman/OCI path shapes before area emission.
- [0003: Pluggable Owner Adapters with Anchor Signals](0003-pluggable-owner-adapters-anchor-signals.md) — Owner resolution is a pluggable per-shape concern via anchor signals and a two-pass engine; the generic resolver stays the default and fallback.
