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

## Remaining trust and activation gates

1. Founder-approved independent key custody, public-key pin, canonical signed owner record, protected owner-only publication, immutable private evidence retrieval, expiry/replay policy and separate T2 implementation GO.
2. Harden ancestor-directory TOCTOU and hostile-filesystem isolation. The mutable synthetic staging root is not a trusted atomic snapshot.
3. Separate Architecture Lock for any protected verdict writer. Neither `ASSERTION_PASS` nor a signed owner pin alone can write `VERIFIED`.
4. Diagnose PR #7 pre-job `startup_failure` and cost controls before any GitHub Actions/PR trigger. ALPS-based qualification is a later PRODUCT-linked gate, not a blocker for synthetic company development.

**No CI, main merge, deployment, paid service, ALPS production probe or Orchestrator activation is authorized by this document.**
