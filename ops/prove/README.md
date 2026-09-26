# C3 — Offline PROVE checker: synthetic v0.2a

**Current status:** independently source-bound technical PROVE PASS in the offline/synthetic scope (**42/42** across the recorded combined suite, including five C4 local-watchdog tests). **Trusted activation remains BLOCKED.** ALPS Phase 4.18 is not a prerequisite for company-side synthetic development. No protected-ledger `VERIFIED` verdict, production authority, network access or deployment is granted.

## Current Layer A + B behavior

- **Layer A:** pre-pinned 40-hex source commit and raw manifest SHA-256; closed evidence bundle; bounded descriptor-based reads; reject undeclared files, symlinks, path escapes, invalid JSON and byte/size mismatches. A CLI-supplied pin is not proof of independent owner approval.
- **Layer B (v0.2a only):** bounded `json_pointer_equals` and `sha256_equals` assertions with a flat `all` of up to 32 unique assertions; no regex, dynamic operators or nested logic. False propositions yield `ASSERTION_FAIL` with nonzero exit. A valid synthetic proposition yields `ASSERTION_PASS`, **not** protected `VERIFIED`.
- The older v0 manifest path may yield `OBSERVED`; `UNVERIFIABLE` and `CHECK_ERROR` remain fail-closed error outcomes. Neither `OBSERVED` nor an assertion result is a release authorization.

## Offline usage

```bash
node --test ops/tests/prove-fixture.test.mjs ops/tests/assertions-v02a.test.mjs
node ops/checks/prove-fixture.mjs <manifest.json> <staged-root-dir> <preapproved-manifest-sha256> <preapproved-commit-sha>
```

Only use unprivileged synthetic fixtures and independently pre-approved pins. Limits: 64 KiB manifest, 16 evidence entries, 1 MiB cumulative evidence, exact bounded size per entry, regular files only. The command does not itself establish approval provenance.

## Evidence already reviewed

- Exact BUILD implementation: [`6d31787`](https://github.com/ramistino/nulvr-ops/commit/6d3178711dadf84d777be28b34f1c0d198a9bc56).
- Independent source-bound technical PROVE: [`2169ecc`](https://github.com/ramistino/nulvr-ops/commit/2169ecce4b8156eebd4eaa7cdcff2e3bbb8eb82b), seven exact source blobs and **42/42** passing combined offline tests on Node v22.16.0. This count includes five C4 local-watchdog tests and must not be described as 42 C3-only tests.
- Unsigned [owner-pin v0.1a design](./owner-pin-design-v0.1a.md) and [schema](./owner-pin-design-v0.1a.schema.json): independently reviewed **19/19 structural cases**. Format validation is not cryptographic attestation.

## Local Owner Pin implementation — current branch

Founder T2 authorization covers **local-only C3 implementation**, not trusted activation. The branch now contains `owner-pin-local.mjs`, strict raw-JSON preflight, an offline rehearsal, `offline-owner-pin-integration.mjs`, `trust-source-contract.mjs`, and `local-replay-registry.mjs`. The historical **42/42** result above belongs to the earlier v0.2a combined suite; it is not the current Owner Pin test count.

- `verifySyntheticOwnerPinFixture` exercises ephemeral Ed25519 signatures, pinned snapshot comparisons, expiry and replay rejection. Its `OBSERVED` result is explicitly synthetic and has neither ledger-write nor release authority.
- `verifyOfflineOwnerPin` is the operational entry point. It currently returns `UNVERIFIABLE` because `trust-source-contract.mjs` deliberately has no authenticated positive branch. Caller-supplied labels, receipts, hostile getters and proxies cannot grant authority.
- `reserveReplayId` is a local, single-filesystem O_EXCL/fsync prototype with root and ancestor checks. `RESERVED_LOCAL_ONLY` is **not** a protected, transactional multi-host replay decision.
- The latest local C3 suite reported **114/114** passing on Node v22.16.0 against source/test blobs matched to published branch HEAD [`ed69ef6`](https://github.com/ramistino/nulvr-ops/commit/ed69ef6bf7d2ab918f113ed897c967755b53f4ca), including the corrected RFC 8785 numeric vector and replay-input regression tests. This is local synthetic technical qualification, not independently authenticated trusted activation, protected-ledger qualification or a production CI result. The historical trust-contract and integration subset was **27/27** at its earlier review.
- See [trust-root-provisioning-gate.md](./trust-root-provisioning-gate.md) for the founder-controlled public-key pin, independently acquired immutable evidence, protected trust root, and transactional single-writer ledger required before any future trusted result.

**Activation status: BLOCKED.** No protected `VERIFIED` writer, merge, deployment, paid CI, or production authority has been enabled.

## Remaining trust and activation gates

1. **Local-only T2 implementation GO is already granted and exercised.** A **new, separate founder approval** is required before provisioning or activating independent key custody, the founder-approved public-key pin, protected owner-only publication, immutable private evidence retrieval, or production expiry/replay enforcement. No agent may generate or claim the founder key.
2. Harden ancestor-directory TOCTOU and hostile-filesystem isolation. The mutable synthetic staging root is not a trusted atomic snapshot.
3. Separate Architecture Lock for any protected verdict writer. Neither `ASSERTION_PASS` nor a signed owner pin alone can write `VERIFIED`.
4. Diagnose PR #7 pre-job `startup_failure` and cost controls before any GitHub Actions/PR trigger. ALPS-based qualification is a later PRODUCT-linked gate, not a blocker for synthetic company development.

**No CI, main merge, deployment, paid service, ALPS production probe or Orchestrator activation is authorized by this document.**
