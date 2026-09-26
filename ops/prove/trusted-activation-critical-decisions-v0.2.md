# C3 critical-decision resolution proposal v0.2 — NOT AN ARCHITECTURE LOCK

Status: DESIGN PROPOSAL ONLY. D01–D03 are specified here for independent review, not closed. No separate founder T2 implementation/provisioning approval, activation approval, protected host, founder key, ledger writer, CI, merge or deployment is implied.

Supersedes no code. References: trusted-activation-acceptance-v0.1.md (T01–T10) and trusted-activation-architecture-review-v0.1.md (D01–D07).

## D03 — process boundary: single protected process for first pilot

Choose a **single protected service process** that acquires independently pinned source bytes, verifies the Owner Pin, reserves replay IDs and writes a committed internal decision. Keep BUILD, PROVE, CI, and public API callers outside this process and unable to alter its protected trust root or database. This is a design simplification, not a claim that in-process isolation alone defeats compromise of that process.

- Do not export a `trustSourceAuthenticated` boolean, a capability constructor, or an API for caller-provided `actual` or `anchor` in the protected service.
- Internal acquisition returns a closure-private, non-serializable object with exact immutable snapshot digest, key-pin version, verification ID, expiry, and service boot identity. Only the internal verification function can pass it to the transaction function.
- The internal object must not be accepted from JSON, IPC, HTTP, environment variables or repository code. If future separation into processes is needed, D03 reopens and requires authenticated, audience-bound IPC and single-use transaction IDs.
- Threat limitation: hostile code executing *inside the protected process* could access its memory. Therefore no untrusted plugins, eval, mutable imported worktree modules, or agent-controlled runtime configuration may run there; host/process hardening requires separate PROVE.

## D01 — replay, decision and audit atomicity

Use a single protected transactional database for the initial pilot. **All three rows must commit atomically**: (a) replay reservation uniquely keyed by `(trust_domain, verification_id)`, (b) immutable decision record bound to snapshot digest/key version/scope, and (c) durable audit outbox row with deterministic `event_id`. Only after commit may a separate publisher deliver the outbox entry. Publication is an effect, not authority; a consumer must deduplicate by `event_id`.

Proposed schema contract (not executable DDL):

- `replay_reservations(trust_domain, verification_id, binding_sha256, decision_id, created_at, UNIQUE(trust_domain, verification_id))`
- `decisions(decision_id PRIMARY KEY, verification_id, snapshot_sha256, key_pin_version, scope, expiry, status, immutable_created_at)`
- `audit_outbox(event_id PRIMARY KEY, decision_id UNIQUE, payload_sha256, delivery_state, attempt_count)`
- `restore_guard(epoch, checkpoint_digest, externally_confirmed_sequence)` stored/attested separately as specified in D02.

**Transaction algorithm:** verify protected acquisition and signed scope; check key/revocation/clock; BEGIN IMMEDIATE (or equivalent serializable writer lock); insert unique replay ID; insert decision; insert audit outbox; COMMIT with database durability settings and storage assumptions independently tested. On uniqueness conflict, return UNVERIFIABLE/REPLAY_DETECTED with no new authority. On unknown commit outcome, query durable decision by ID only after trusted storage recovery and D02 checkpoint validation; otherwise fail closed. Never delete a possibly committed reservation to retry.

**Critical invariant:** an outbox event is not a second authorization token. A committed internal decision is still not an externally published `VERIFIED` verdict until separately approved writer architecture, audit delivery semantics, all T01–T10 gates and founder activation are satisfied. Audit sink outage blocks external publication; it must not erase a committed replay reservation.

Crash matrix:

| Crash point | Recovery rule |
|---|---|
| Before transaction | No reservation or verdict; original request may retry with same ID after all gates are rechecked |
| After replay insert but before COMMIT | Roll back entire transaction; no decision/outbox visible |
| After COMMIT but before response | Read exact committed binding after D02 continuity check; never issue a second grant |
| After COMMIT before audit delivery | Outbox persists; external publication blocked until durable audit acknowledgement |
| After audit delivery before marking delivered | Retry same event ID; downstream idempotency required |
| Database or audit durability ambiguous | UNVERIFIABLE and no external publication until independent recovery |

## D02 — rollback/restore continuity: external checkpoint is mandatory

A local transactional database alone cannot detect restoring a valid older snapshot. Before operational activation, founder must approve an **independently controlled monotonic checkpoint** outside the database backup/restore domain. Every externally publishable decision must bind a strictly advancing sequence and hash-chain head to this checkpoint, with an independently verifiable acknowledgement. If checkpoint or acknowledgement is unavailable, fail closed: no publication.

Proposed protocol:

1. On service start, independently authenticate checkpoint identity and compare `epoch`, `sequence` and `chain_head` with local committed decision history.
2. If local history is behind, mismatched or cannot prove continuity, enter `RESTORE_QUARANTINE`; refuse new protected decisions and publication until independently reconciled.
3. For each new decision, atomically commit replay/decision/outbox with a pending checkpoint sequence, then durably advance and acknowledge the external checkpoint **before** publishing authority. A crash between local commit and checkpoint acknowledgement is an ambiguous pending decision: do not reassign its sequence or release authority; reconcile the same binding.
4. On recovery, checkpoint ahead of local history is a rollback signal. A restored database must not accept prior verification IDs; if the full prior history cannot be reconstructed and verified, keep the service blocked and rotate to a separately approved new trust epoch only after independent reconciliation and explicit founder approval.
5. Backups, replicas and checkpoint service must not share the same administrative rollback domain. Checkpoint unavailability is a hard stop; never use an unprotected file or local environment counter as fallback.

**Open operational decision:** exact checkpoint implementation, custody, availability and cost have not been selected. This proposal does not claim a zero-cost protected solution or solve administrator compromise.

## Required independent tests before D01–D03 can be closed

- Transaction crash injection at each point above; no orphan published verdict, no duplicate grant, and durable reservation after ambiguous commit.
- Two-process concurrency and simulated multi-host replay collision on the same verification ID; one unique committed binding only.
- Audit outage, duplicate outbox delivery, consumer restart and delivery acknowledgement loss.
- Restore a database backup predating a published decision; checkpoint mismatch must quarantine before any new authority.
- Crash between local commit and external checkpoint acknowledgement; recovery must reconcile same binding or remain blocked.
- Fake serialized capability, hostile getter/Proxy, injected environment pin and mutable worktree substitution must never authenticate provenance.
- Restart with mixed code/trust-root versions and a revoked key; reject until independently reviewed.

## Review outcome and next gate

D01: concrete atomicity/outbox design **PROPOSED, NOT PROVEN**.
D02: external continuity protocol **PROPOSED, IMPLEMENTATION/CUSTODY/COST UNRESOLVED**.
D03: single-process boundary **PROPOSED, HOST ISOLATION NOT PROVEN**.
D04–D07 remain open. T01–T10 remain blocked for trusted activation. No protected `VERIFIED` writer is implemented or authorized.
