# C3 owner-pin contract v0.1 — DESIGN ONLY

**State:** unsigned, unapproved schema candidate. The JSON schema validates field shape and rejects unknown fields; it is **not a cryptographic signature check or a founder approval**. It is staged separately from operational C3 and from the protected VERIFIED-writer gate. Current synthetic C3 v0.2a remains the only implemented layer.

## Frozen candidate, zero additional service

One owner-approved payload binds exactly:
- a unique verification ID; a strictly **synthetic-offline** scope;
- source repository plus immutable exact 40-hex commit;
- list of raw SHA-256 digests for **each** executable checker source file (not a self-reported aggregate);
- raw manifest SHA-256 and exact manifest path;
- private-capable evidence Git repository + exact commit + exact Git tree SHA;
- fixed C3 v0.2a assertion policy; UTC approval/expiry; fingerprint of a separately pinned founder Ed25519 public key.

The record is **not** valid merely because BUILD writes a structurally correct JSON object. The Git SHA-1 object/tree identity provides an address; the raw SHA-256 digests provide independent content checks. Git trees must be fetched from the *specified* repository/commit and enumerated recursively. Compare the tree and every declared file with the pinned manifest; reject hidden undeclared files, symlink mode 120000, gitlinks mode 160000, special entries, path escapes and over-limit archives. Preserve private ALPS evidence exclusively in an approved private evidence repository; the public `nulvr-ops` repo may contain only nonsecret digests/references.

## Signature envelope — proposed, no real key or signature created

- Construct the approval payload with **RFC 8785 JCS** canonical JSON, rejecting duplicate JSON object keys and noncanonical received bytes before signature processing. Reject Unicode/number cases outside the chosen canonicalizer's supported strict profile.
- Verify **Ed25519** signature over UTF-8 bytes `NULVR:OWNER-PIN:V0.1\n` followed by the canonical payload bytes. The signature and payload are stored as separate fields; signature does *not* appear inside the signed payload.
- `signerKeySha256` is a hint bound within the signed payload, **not a root of trust**. The authorized founder public key/fingerprint and key-rotation/revocation policy must be pinned through an independent read-only owner-controlled channel, **outside BUILD, PROVE, and the same untrusted repository**. The founder retains the private key offline; this task never generates or stores it.
- Do not accept a GitHub reviewer or unsigned Git commit as a substitute for cryptographic founder attestation. Current main ruleset requires one review but not an exact founder-only review/signature.
- No signature verifier, publishing script, key enrolment or protected approval record is implemented by this design artifact.

## Replay and expiry

Before evaluation, compare approval time and expiry against trustworthy execution time. Reject expired records and future-dated approvals. One verification ID may be replayed only for an **identical** signed-payload digest in explicit deterministic recheck mode. A different digest with the same ID is `CHECK_ERROR`; without an independently maintained used-ID history, one-shot semantics cannot be claimed and trusted use must return `UNVERIFIABLE`. There is currently no such protected used-ID registry.

## Gate sequence

1. GUARD verifies actual owner key custody, independent public-key pin, genuine protected publication primitive, immutable private evidence repository and zero incremental spend. Current main ruleset is not by itself an owner-only anchor.
2. Independent PROVE reviews this proposed shape and adversarial cases: forged signer, key-substitution, changed source/checker/manifest/tree, unknown fields, duplicate JSON keys, symlink tree entry, stale expiry, reused ID, inaccessible or expired evidence and signature replay across scope/version.
3. Founder makes a **separate T2 GO/NO-GO** for implementing the owner-pin verifier and read-only immutable retrieval. No request to sign an actual approval exists yet.
4. A protected VERIFIED verdict writer, any ALPS qualification, real workload activation and Orchestrator are separate gates after these conditions.

**Hard stop:** If signer provenance, immutable evidence bytes or used-ID semantics cannot be independently proven at no new authorized cost, return `UNVERIFIABLE` and keep synthetic C3 separate from trusted verification.
