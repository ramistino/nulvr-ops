# C3 trusted-activation acceptance contract v0.1 — DESIGN ONLY

Status: DRAFT / NOT AUTHORIZED FOR IMPLEMENTATION OR ACTIVATION. This contract is not a trust receipt, founder approval, protected pin, ledger, or production verdict. C3 local synthetic qualification is separate from trusted activation.

## Fixed authority boundaries

- BUILD prepares code and tests; PROVE independently examines exact source, artifacts and negative tests; GUARD checks policy, cost and audit controls; only the founder approves separate activation.
- The founder, not an AI agent or the source checkout, generates or controls the signing key and independently confirms the public-key SPKI SHA-256 fingerprint. Never request, transmit, store or print the private key in repository, logs or chat.
- An operational trust decision must originate in a protected acquisition component, not from caller-provided `trustSourceAuthenticated`, `actual`, `anchor.origin`, `snapshot.verifiedSource`, or `RESERVED_LOCAL_ONLY`.
- Every failure, ambiguity, timeout, crash and stale snapshot yields UNVERIFIABLE with ledgerWrite=false and releaseAuthority=false. No automatic fallback to synthetic status.
- A successful signature, an independently pinned key, a replay reservation, and an assertion pass are distinct prerequisites, never equivalent to VERIFIED.

## Acceptance matrix — all mandatory before any positive trust path

| ID | Gate | Required independent evidence | Mandatory rejection cases |
|---|---|---|---|
| T01 | Founder key custody | Founder-owned key creation/custody procedure and out-of-band fingerprint approval; no private-key export | Agent-generated key, key in repo, fingerprint derived solely from signed payload |
| T02 | Protected trust root | Root outside worktree under separately controlled OS identity; audited owner/mode/ancestor policy and immutable configuration | Symlink, writable ancestor, unexpected owner, stale pin, changed root during acquisition |
| T03 | Immutable acquisition | Independently controlled read-only fetch by exact commit/tree and raw bytes; SHA-256 computed from acquired bytes | Mutable branch reference, caller-supplied digest, Git tree mismatch, file substitution, partial read |
| T04 | Signed scope | Canonical RFC 8785 payload, strict duplicate-key JSON preflight, Ed25519 verification, domain separation, expiry <=24h and exact approved synthetic/operational scope | Signature alias, wrong key, malformed Unicode, extra fields, replayed or expired approval, scope escalation |
| T05 | Authenticated provenance | Protected component constructs an opaque internal capability bound to T02/T03/T04 and process identity; no API-serializable boolean or self-attestation | Forged receipt, hostile getter/Proxy, object spread, serialization/replay of capability, stale acquisition |
| T06 | Protected replay store | Founder-approved single-writer durable transaction binds verificationId + key fingerprint + immutable snapshot + verdict identity; commit reservation before verdict | Concurrent claims, process crash at each write/fsync boundary, rollback/restore, duplicate across hosts, ambiguous commit |
| T07 | Protected verdict writer | Separate approved architecture lock and least-privilege writer; append-only audit of exact input digests, signer, verification ID and gate outcomes | Synthetic OBSERVED/ASSERTION_PASS/RESERVED_LOCAL_ONLY writing VERIFIED; partial gate success; caller-supplied status |
| T08 | Recovery and revocation | Documented key rotation, revocation, expiry, replay-store backup/restore and deterministic crash recovery; independent PROVE | Revoked key, old snapshot after rotation, restored replay database admitting duplicate, clock rollback |
| T09 | Isolation and adversarial review | Separate BUILD and PROVE identities, source-bound review and repeatable negative fixtures in isolated environment | TOCTOU root replacement, hostile filesystem, symlink race, malformed input, mixed-version modules |
| T10 | Cost and activation control | Founder-approved separate T2 for provisioning/implementation, then separate explicit activation approval; zero-cost local tests until approved | Unapproved paid CI, external probes, production deploy, main merge, ledger mutation |

## Implementation sequence (not authorization)

1. Founder reviews this contract and chooses whether to authorize a separately scoped T2 design/provisioning exercise. No keys or privileged infrastructure are created now.
2. Independently review a threat model and architecture lock: trust-root owner, immutable acquisition, in-process capability, transactional replay, writer isolation, recovery and revocation.
3. BUILD implements only the separately approved scope on a feature branch; negative tests must be written before any positive trust path.
4. PROVE re-fetches exact committed Git blobs, runs all local suites and adversarial crash/concurrency tests independently, and records immutable test inputs and results.
5. GUARD verifies all T01–T10 evidence and confirms cost/permission boundaries; any missing gate means BLOCKED.
6. Founder explicitly approves or rejects activation separately. No inferred approval from prior local T2 GO, a passing suite, this document or an issue/PR status.

## Current baseline (2026-09-26)

- Published local-only C3 correction: `ed69ef6bf7d2ab918f113ed897c967755b53f4ca`; local suite reported 114/114, Node v22.16.0, synthetic scope only.
- `trust-source-contract.mjs` intentionally has no authenticated positive branch.
- `local-replay-registry.mjs` is a single-filesystem local prototype, not protected transactional multi-host replay.
- No founder key, protected trust root, immutable acquisition authority, protected VERIFIED writer, paid CI, merge, deploy or production authority is enabled.
