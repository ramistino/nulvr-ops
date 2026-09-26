# C3 v0.2a — offline Layer B implementation checkpoint

**Scope:** founder-approved synthetic/offline only. No protected ledger writer, trusted VERIFIED verdict, external networking, CI, production endpoint, GitHub merge, deployment, spending or Orchestrator activation.

## Exact implementation staged

- `ops/checks/prove-fixture.mjs` Git blob `272e38e40dd5b33446a33cd37c4143b73d78be18`: retains closed-bundle Layer A, adds an independently pinned v0.2a manifest, bounds actual bytes read and evaluates Layer B only after raw file hash/size/JSON checks.
- `ops/checks/assertions-v02a.mjs` Git blob `ecd2f3144c6da348081ef87904b751a98d70f3cb`: strict typed scalar JSON-pointer equality and raw SHA-256 equality; one flat `all` over up to 32 uniquely named assertions. Regex, dynamic dispatch and nested expressions are forbidden.
- `ops/tests/assertions-v02a.test.mjs` Git blob `ca76b8f558f932539ec4e39540fafd92362ba11f`: 20 synthetic assertion/negative-path tests. Existing C3 closed-bundle tests and C4 local watchdog tests are unchanged.

## Executed local evidence

Runtime Node v22.16.0; original local worktree files were checked with `git hash-object` against the Git blobs listed above. The local command:

```bash
node --test ops/tests/prove-fixture.test.mjs ops/tests/local-harness.test.mjs ops/tests/assertions-v02a.test.mjs
```

produced **42 passed / 0 failed** (17 closed-bundle Layer-A + 5 local C4 watchdog + 20 bounded Layer-B assertions) in approximately **1.43 s**. Recorded local log: `/mnt/data/nulvr-c3-v02a/final-verified-run.log` (local session artifact, not a retained GitHub CI artifact).

Checks cover typed mismatch, false propositions, absent and malformed pointers, object/array rejection, escape sequences, array index normalization, forbidden regex, duplicate/omitted assertions, more than 32 assertions, tampered manifest, wrong source pin, undeclared dotfiles/nested files, symlinks, and original v0 checks. `ASSERTION_FAIL` is a nonzero process exit, not a trusted `REFUTED` ledger verdict. `ASSERTION_PASS` is an **offline synthetic result only**, never a protected `VERIFIED` ledger verdict.

## Required next gate

PROVE must separately re-fetch this **exact new company-branch commit and all three blobs**, run the tests in a fresh workspace, and challenge the filesystem race and independent pin-provenance assumptions. GUARD must confirm that the code has no network, external write, protected ledger, deployment, merge, billing or production dependencies. C3 remains a synthetic candidate until those checks pass.

Do **not** open a PR or trigger OPS GitHub Actions while PR #7 has an unproven zero-job `startup_failure`. The owner-approved Architecture Lock does not waive release or governance gates.
