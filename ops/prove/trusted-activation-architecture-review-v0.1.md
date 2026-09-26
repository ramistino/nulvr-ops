# C3 architecture review v0.1 — decisions and blocking findings

**Review scope:** source-level consistency review of `trusted-activation-acceptance-v0.1.md`, `trusted-activation-architecture-lock-candidate-v0.1.md` and `trust-root-provisioning-gate.md`. No implementation, provisioning, founder key, protected receipt, CI, deployment or production verdict. A design review is not an independent runtime PROVE.

## Review disposition

**DESIGN NOT LOCKED — three critical decisions and four supporting decisions remain open.** Local synthetic C3 qualification (reported 114/114 at the earlier published source revision) does not discharge any trusted-activation gate.

| ID | Severity | Finding | Required architecture decision | Acceptance evidence |
|---|---|---|---|---|
| D01 | CRITICAL | Current proposal says reserve/commit replay before publishing a verdict, while requiring durable audit; these can become inconsistent after a crash. | Define one atomic database transaction for unique replay reservation, immutable decision state and durable audit outbox. The protected publisher only publishes committed outbox entries idempotently. If audit sink is separate, specify delivery acknowledgments and duplicate suppression; no external publication before durable transaction. | Fault injection before/after each transaction step and outbox delivery; no double authority, no unlogged published verdict, deterministic recovery. |
| D02 | CRITICAL | Restoring an old replay-store backup can erase reservations and admit the same verification ID again. A proposed monotonic watermark is not yet designed. | Choose a separately protected monotonic checkpoint/epoch with restore reconciliation, or explicitly forbid restores that cannot prove continuity and keep activation blocked after ambiguous recovery. Backup encryption alone does not prove freshness. | Replay pre-restore IDs after recovery; reject rollback and unverifiable watermark; fail closed when external checkpoint unavailable. |
| D03 | CRITICAL | Proposal describes an in-process opaque capability but also a separate protected verdict-writer process; the cross-process trust handoff is unspecified. | Either co-locate verification and verdict writer inside one independently protected process with narrow privilege separation, or define authenticated IPC with mutual process identity, audience-bound single-use request IDs, expiration and channel binding. Never accept caller-serialized capabilities. | Forged IPC peer, copied receipt, stale request, process restart and mixed-version negative tests. |
| D04 | HIGH | Independent acquisition is described without defining how Git commit/tree/raw-byte authenticity is rooted. | Define the approved immutable source identity and independently controlled fetch/verification chain, including raw Git object hash/tree membership, expected manifest and SHA-256 digest. Treat transport authentication and object identity as separate checks. | Substitute branch tip, wrong tree, hash collision simulation, truncated file and changed transport endpoint. |
| D05 | HIGH | Founder key rotation and revocation policy has no effective-time or historical-verdict rule. | Define signed approval time vs independently observed verification time, revocation epochs, historical audit preservation and fail-closed behavior when revocation state cannot be read. | Old key after rotation, backdated payload, clock rollback, revocation-store outage. |
| D06 | HIGH | Local filesystem prototype's ancestor checks are not TOCTOU-safe and do not establish protected multi-host semantics. | Do not reuse it as production replay store; require independently protected storage with durable uniqueness and transactional commit. If filesystem-backed, specify descriptor-relative traversal, mount policy and crash durability proof. | Concurrent processes/hosts, directory replacement, crash/restart, fsync ambiguity. |
| D07 | HIGH | Separate BUILD/PROVE roles are documented but not backed by distinct operational identities or immutable evidence. | Specify role-bound permissions and independent source/evidence acquisition; prevent BUILD from modifying PROVE results or protected root. | Attempt unauthorized mutation, source revision mismatch, tampered test artifact. |

## Proposed zero-cost design baseline (not a deployment selection)

- **Prefer one protected verification-and-writer service with one transactional local database for the first authorized pilot**, if the founder later approves a dedicated isolated host and the security review confirms its threat model. This reduces cross-process and distributed consistency complexity. It does not eliminate independent key custody, immutable acquisition or restore-rollback controls.
- Keep the existing local replay prototype synthetic-only; do not migrate its files into protected state.
- Treat the durable outbox as part of the same replay/decision transaction. Publishing the same committed outbox event twice must be idempotent and must never produce a second authority grant.
- Until a separately protected rollback checkpoint is specified and tested, **backup restore means BLOCKED**, not automatic continuation.
- Cost estimate is not asserted: a local design document is free, but a protected host, key custody and durable checkpoint may require infrastructure. No spending or paid CI is approved.

## Mapping to existing acceptance gates

- T01: D05 key rotation/custody rules remain open; no founder key provisioned.
- T02: D06 protected root/isolation remains open.
- T03: D04 independent immutable acquisition remains open.
- T04: Existing synthetic Ed25519/RFC 8785 tests cover local format behavior only; operational scope and independently approved clock/key state still need review.
- T05: D03 opaque capability and trust-boundary handoff remain open.
- T06: D01/D02/D06 transactional replay, crash recovery and rollback remain open.
- T07: D01/D03 protected writer and durable audit remain open.
- T08: D02/D05 recovery and revocation remain open.
- T09: D06/D07 adversarial isolation and independent PROVE remain open.
- T10: Separate founder T2 implementation/provisioning approval, cost ceiling and separate activation approval remain open.

## Required decision order

1. Resolve D03 process boundary before specifying a capability format.
2. Resolve D01 replay/verdict/audit atomicity before writing the protected ledger.
3. Resolve D02 restore rollback before allowing durable production reservations.
4. Resolve D04/D05 source identity and key lifecycle; then D06/D07 isolation and independent review.
5. Independently review a revised architecture lock and complete every T01–T10 gate; request separate founder approval for any privileged implementation and a further explicit approval for activation.

**Stop condition:** Any unresolved critical decision keeps trusted activation BLOCKED. Passing local tests, this review, a documentation commit or a generic request to continue cannot grant authority.
