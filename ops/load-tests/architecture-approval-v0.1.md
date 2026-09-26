# C4 Architecture Lock v0.1 — limited implementation authorization

**Decision:** GO for branch-only, zero-incremental-spend **offline synthetic hardening**. This records the founder's instruction to continue after the pending C4 gate was presented; it is not an authorization for operational activation or any production-facing change.

**Date:** 2026-09-26. **Pinned design baseline:** `3f5304327820bddfe40591e4e9d73e224bf9a400`, [architecture-lock-v0.1.md](./architecture-lock-v0.1.md). **Independent source review:** `9d3ea435faf1fb15a16383ca0ef36eb8d76e42fd`.

Allowed: bound local config/fixture reads; require one checker-owned, private, local staging directory containing config and fixture; reject symlinks, oversized input and path escapes; distinguish timeout / transport error / HTTP non-200; expose p50/p95/p99 of *successful* watchdog samples separately from failures; retain a bounded loopback-only synthetic child.

Excluded: remote targets, actual ALPS workloads, workflow reruns, PR creation, merge, deployments, paid/cloud resources, protected-ledger writes, authoritative VERIFIED results or independent agents.

**Explicit limitations:** the fixture digest is a provenance marker, not proof that synthetic `/work` consumes the fixture; the build SHA is a provided claim, not owner-pin attestation; a 96 MiB V8 heap setting is **not** an OS RSS or CPU limit. Ancestor-directory race hardening, externally protected pin provenance, OS quotas and production integration remain separate gates.

**Kill criteria:** any bypass of bounded reads or private-root restriction, any production/network endpoint, incorrectly healthy classification of failed liveness, leaked runaway child, unexpected spending, or mutation of protected evidence. Revert the branch-only candidate; no existing production state is changed.

**Verification gate:** BUILD must bind the tested file bytes to exact Git blob hashes, repeat all offline tests at least twice, and hand exact source to PROVE for a fresh source-bound independent technical rerun. GUARD separately reviews no-network/no-spend/no-verdict behavior. This GO does *not* approve the reusable facility's operational activation.
