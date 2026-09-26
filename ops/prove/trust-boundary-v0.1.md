# C3 Trust Boundary v0.1 — protected owner pin + immutable evidence identity

**Status: DESIGN CANDIDATE / NOT ACTIVATED.** This closes the next trust gap after synthetic C3 v0.2a without creating a second evidence authority or a bespoke approval platform.

## Required trust chain

`Founder/authorized owner -> protected immutable approval record -> read-only PROVE -> assertion result`.

BUILD may create candidate evidence but cannot approve the trusted pin for its own evidence. PROVE may read the approval record and evidence but cannot alter either, write a protected verdict, deploy, merge or spend.

## Approval record

Before verification, independently bind: unique verification ID; repository and exact 40-hex source commit; checker SHA-256; raw manifest SHA-256; immutable evidence provider/object ID + raw digest; assertion-policy version; approver identity; UTC approval time; optional expiry. No branch name, `latest` alias, mutable path or BUILD narrative can substitute.

Use canonical JSON with exact schema/keys. The checker does not create, amend or overwrite the record.

## Protected anchor

Do **not** build a new service first. GUARD must identify an existing zero-additional-cost primitive that demonstrably provides owner-only approval, immutable/append-only audit history, read-only PROVE access and exact raw record addressability. BUILD/PROVE runtime must hold no anchor-write credential.

If no existing primitive satisfies this without new paid infrastructure, return `UNVERIFIABLE` and keep C3 synthetic-only. Do not weaken the trust boundary to avoid the gate.

## Immutable evidence

Trusted PROVE fetches evidence by immutable provider/object identity, independently hashes received raw bytes and compares with the owner pin. Local staging is disposable, private and newly created per run; it is never the authority. Unknown/mutable provider identity, missing object, digest mismatch, unavailable source or redirects to mutable identity fail closed.

## Sequence

1. Read immutable owner approval record.
2. Validate schema, authorized approver, expiry and verification-ID policy.
3. Resolve exact repository commit + checker identity independently.
4. Fetch evidence by immutable provider/object ID.
5. Hash evidence and manifest raw bytes; compare with owner pin.
6. Stage into fresh private directory.
7. Run C3 Layer A complete-bundle integrity.
8. Run bounded Layer B assertions.
9. Emit an `ASSERTION_PASS`/`ASSERTION_FAIL` result candidate bound to approval-record digest, evidence digest, checker digest and source commit.
10. Never translate that result to protected `VERIFIED` until a separate verdict-writer T2 Architecture Lock exists.

## Replay / TOCTOU

Verification ID is single-purpose unless policy explicitly permits deterministic recheck. Re-fetch by immutable ID, never path/branch/tag. Bind provider immutable generation/ETag when available and hash bytes after retrieval. Private staging must reject symlinks/non-regular nodes and use bounded descriptor reads. A later approval cannot retroactively authorize an earlier result because every result references the exact approval-record digest.

## Failure semantics

Missing/expired pin or unavailable immutable evidence/source => `UNVERIFIABLE`. Invalid schema/approver, digest mismatch, forbidden replay or mutable identity => `CHECK_ERROR`. Valid inputs with false proposition => `ASSERTION_FAIL`; all true => `ASSERTION_PASS`. None means protected `VERIFIED`.

## Kill criteria

STOP if BUILD/PROVE can self-approve; mutable aliases satisfy identity; evidence changes without digest failure; checker can overwrite anchor/evidence; result is detached from pin/evidence/checker/source; new paid infrastructure is required without founder approval; or trusted verdict writing enters this component.

## Before implementation

1. GUARD verifies a real zero-cost anchor/provider primitive and permissions, or records none exists.
2. PROVE reviews exact schema/replay rules.
3. Synthetic negative fixtures cover stale pin, wrong source/checker/object, digest mismatch, expiry and replay.
4. Founder approves a separate T2 Architecture Lock for pin + immutable retrieval.
5. No CI/main/deploy/production/spending change follows from design approval.

**Conclusion:** ready for independent design review only. C3 remains synthetic-only meanwhile.
