# C3 trusted activation — threat model and architecture lock candidate v0.1

**Status: DESIGN CANDIDATE / NO T2 IMPLEMENTATION GO / NO ACTIVATION.** This document does not change `trust-source-contract.mjs`, `local-replay-registry.mjs`, founder custody, deployment or protected ledger authority. The founder's prior T2 GO applies only to local synthetic C3.

## Assets, actors and explicit trust boundaries

| Asset or actor | Permitted role | Not trusted for |
|---|---|---|
| Founder-controlled signing key | Sign a tightly scoped, short-lived Owner Pin outside agent custody | Repository, CI, chat, BUILD/PROVE processes or automatic renewal |
| Protected public-key fingerprint | Independently pinned by founder in separately owned read-only trust root | Values read from signed payload, worktree, environment alone or caller input |
| Acquisition service | Independently fetch exact immutable commit/tree and raw evidence bytes, calculate digests, produce an internal acquisition handle | Mutable branch tips, caller-supplied `actual` or mutable worktree |
| BUILD | Propose implementation and synthetic fixtures | Issue trusted receipts, alter protected root, approve own changes |
| PROVE | Re-fetch exact source and independently reproduce tests and negative cases | Mint founder authority or write protected VERIFIED |
| GUARD | Check scope, provenance, audit and cost controls | Substitute for founder authorization |
| Protected replay service | Atomically reserve verification ID with key/snapshot/verdict identity | Existing `RESERVED_LOCAL_ONLY` result or per-process memory |
| Protected verdict writer | Commit a verdict only after all approved gates pass | Any caller-supplied `status`, boolean trust receipt or synthetic test output |

**Assumed attacker capabilities:** controls repository files, pull-request input, JSON payloads, API arguments, environment supplied by untrusted jobs, symlinks in mutable staging, concurrent verification attempts, process crashes and replays of old receipts. Do not assume an attacker can break Ed25519 or SHA-256. Compromise of founder custody, host administrator or protected trust-root owner is outside the local synthetic proof and requires separate operational controls.

## Proposed architecture (subject to founder approval)

1. **Key custody and pin:** founder provisions Ed25519 key outside NULVR agent execution; independently approves SPKI SHA-256 fingerprint; protected pin installation records owner, mode, immutable version, effective time and revocation state. No private key enters BUILD, PROVE, CI or GitHub.
2. **Acquisition:** a separately controlled read-only service resolves the approved commit/tree, reads raw bytes by immutable identity, verifies file list, size, hash, commit/tree binding and an immutable acquisition timestamp. Reject branch-only references and incomplete reads. Its internal handle is bound to snapshot digest and trust-root version.
3. **Verification:** strict raw JSON duplicate-key preflight; RFC 8785 canonicalization; Ed25519 domain-separated signature; exact approved scope, key pin and bounded validity; digest comparison against acquired bytes. Caller-supplied provenance remains inert data.
4. **In-process capability:** acquisition and verification occur within a protected boundary. A non-serializable internal capability is bound to process, approved trust-root version, snapshot, verification ID and expiry; it is never accepted from an HTTP request or exported as JSON. Cross-process handoff, if needed, requires separately designed authenticated transport and audience binding.
5. **Replay transaction:** protected single-writer durable database with uniqueness on `(trust_domain, verification_id)`; transaction binds key fingerprint, immutable snapshot, scope, expiry and intended verdict. Reserve and commit before any verdict publication; crashes after commit are idempotent reads of the same record, never second authorization. Reject same ID with different binding.
6. **Verdict writer:** separate least-privilege process, explicit architecture lock and founder activation approval. Writer accepts only an internal committed replay transaction plus all independently checked gates; emits append-only audit record and never derives `VERIFIED` from `OBSERVED`, `ASSERTION_PASS` or `RESERVED_LOCAL_ONLY`.

## Failure-state contract

- **UNVERIFIABLE:** missing or ambiguous root, invalid signature/scope, stale or revoked key, untrusted acquisition, replay collision, database outage, clock ambiguity, incomplete fsync or any unclassified exception. `ledgerWrite=false`, `releaseAuthority=false`.
- **OBSERVED:** signature and snapshot matched in local synthetic checks; never trusted authority.
- **RESERVED_LOCAL_ONLY:** current filesystem prototype reserved one ID; never protected replay.
- **Future trusted internal outcome:** requires every approved gate and a committed protected replay transaction. No public status name or positive branch is authorized by this design.
- **No fallback:** protected service outage must not silently switch to worktree pin, local replay prototype or caller boolean.

## Adversarial acceptance cases to implement only after separate T2 GO

| Case | Injection / concurrent condition | Required outcome |
|---|---|---|
| A1 | Worktree changes after independent snapshot acquisition | Reject changed digest or use original immutable bytes; never re-read mutable worktree |
| A2 | Symlink or writable ancestor swapped during trust-root read | Reject; no positive capability |
| A3 | Caller supplies `trustSourceAuthenticated:true` or serialized fake capability | Reject; no ledger write |
| A4 | Concurrent same verification ID across 2 processes / 2 hosts | Exactly one durable reservation; other claimants rejected or idempotently read same committed record without second authority |
| A5 | Crash before, during and after replay transaction commit | No duplicate authorization on restart; ambiguous commit fails closed |
| A6 | Restored backup predates prior successful reservation | Detect rollback via independently protected monotonic watermark or fail closed |
| A7 | Revoked/rotated key signs otherwise valid payload | Reject by protected key version and effective/revocation time |
| A8 | Clock rollback, expired pin or approval longer than policy | Reject |
| A9 | Acquisition returns wrong commit, tree, raw bytes or truncated file | Reject independently; no caller-provided digest accepted |
| A10 | One gate passes while another fails; writer receives synthetic `OBSERVED` | No VERIFIED write and no release |
| A11 | Audit sink or durable storage unavailable | Fail closed; do not publish verdict before durable audit and replay decision |
| A12 | Partial deployment runs mismatched trust-root/schema versions | Reject mixed version; no permissive compatibility fallback |

## Decisions required before implementation

1. Founder-approved custody and independent key-fingerprint approval method.
2. Independently controlled host and trust-root owner; isolation from BUILD/PROVE and worktree.
3. Immutable acquisition transport and verifiable snapshot format.
4. Single-writer transactional database, durability model, recovery watermark and multi-host semantics.
5. Protected writer boundary, audit sink, revocation and rotation procedure.
6. Separate T2 scope and explicit cost ceiling; any paid CI or production action requires additional explicit approval.

## Qualification / stop rules

BUILD supplies negative tests and exact-source commit; independent PROVE repeats them with separately acquired source and records machine-verifiable results. GUARD checks every T01–T10 item in `trusted-activation-acceptance-v0.1.md`. Any unknown or failed gate remains BLOCKED. A separate founder decision is required for implementation/provisioning and again for activation. No automatic merge, CI rerun, deploy, spending, protected ledger mutation or ALPS probe is implied.

**Current baseline:** local C3 114/114 reported on Node v22.16.0 against published correction `ed69ef6`; protected trust source, transactional replay store and VERIFIED writer remain NOT IMPLEMENTED. ALPS 4.18 remains NOT PASS and does not block company-side design.
