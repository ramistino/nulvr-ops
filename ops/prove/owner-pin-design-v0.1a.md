# C3 Owner Pin v0.1a — scoped design correction

**Status: DESIGN CANDIDATE / NOT APPROVED / NO TRUSTED IMPLEMENTATION.** This revises the unsigned v0.1 schema before any owner-signature implementation; no main/CI/production action or owner key is involved.

## Adversarial design defect resolved

Fresh source review of v0.1 found that its generic `manifestPath`/checker-file regex **accepted** the bare paths `..`, `.`, `foo/..`, `foo/.`, `foo//bar` and `foo/`. A syntactically accepted untrusted path is not a safe filesystem boundary, even if a later checker might reject it. Rather than add a second parser, this narrowly scoped v0.1a schema fixes the only paths required by the existing C3 v0.2a implementation:

- `manifestPath` must be exactly `manifest.json`.
- `checkerFiles` must be **exactly two ordered objects**: `ops/checks/prove-fixture.mjs` followed by `ops/checks/assertions-v02a.mjs`, each with 64-hex raw SHA-256. No arbitrary paths, duplicates or imported third-party code are approved.
- Source/evidence Git repository strings must start with an alphanumeric owner/name; exact repository identity and read permissions remain runtime checks.
- `expiresAt` is mandatory UTC RFC3339 text (no indefinite null). The future verifier must additionally enforce approval-time/expiry chronology and a founder-approved maximum validity duration; the JSON Schema alone does **not** perform temporal policy.

## Frozen proposed signature/identity boundaries

Carry the v0.1 trust design unchanged: owner-offline Ed25519 signature over domain-separated RFC8785 canonical payload bytes; independently pinned founder public-key fingerprint held **outside** BUILD/PROVE; exact source Git commit, raw checker digests, manifest SHA-256 and evidence Git tree; read-only immutable retrieval and closed-bundle validation. The example in `owner-pin-UNSIGNED-design-example.json` is intentionally **not signed** and carries placeholder hashes, not a real approval.

A signed payload is not a protected verdict. Even if signature verification is later implemented, one-shot replay semantics require an independent protected used-ID record; without it the checker may offer only idempotent deterministic rechecks and must not claim once-only release authorization. A protected `VERIFIED` writer requires its own separate lock.

## Minimum independent pre-implementation tests

Reject: wrong scope/policy, fake key, absent expiry, `expiresAt:null`, extra fields, reordered/duplicate/imported checker paths, wrong source/evidence repository form, wrong SHA lengths, manifest paths such as `..` or `/manifest.json`, stale or substituted evidence tree, mismatched canonical payload/signature, duplicate-key JSON, signature replay across a different scope/schema version, and forbidden verification-ID rebind.

Only the **schema-level** rejection of shape/fields/path constants is in scope for the unsigned design check now. Key authenticity, Git tree provenance, chronological policy, signature validity, immutable storage and replay require a separately approved verifier and independent proof.

**Next gate:** PROVE independently re-fetches this exact version and tests its shape. Then GUARD must confirm an actual zero-cost owner-only signing/publishing mechanism and protected independent public-key pin. Founder GO for any trusted implementation remains pending.
