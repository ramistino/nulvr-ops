# C3 v0.2a — offline implementation checkpoint

**Workstream:** COMPANY, independent of ALPS 4.18. **Approval:** founder-authorized scope-limited offline synthetic implementation, 2026-09-26. This is not a trusted checker release.

## Reproducible test

From the exact files in this branch:

```bash
node --test ops/tests/prove-fixture.test.mjs ops/tests/assertions-v02a.test.mjs ops/tests/local-harness.test.mjs
```

Local Node.js v22.16.0 result: **42 tests passed, 0 failed**, including 17 existing C3/C4 tests, 5 closed-bundle hardening tests, and 20 new v0.2a assertion tests. Test-run log SHA-256: `456452118cc761a766e528b8f1a08a13f40fad15bbbb4035c9d335a655a23356`.

Source identities, verified against local `git hash-object` before upload:
- C3 entrypoint: `272e38e40dd5b33446a33cd37c4143b73d78be18`
- New bounded assertions module: `ecd2f3144c6da348081ef87904b751a98d70f3cb`
- New v0.2a tests: `ca76b8f558f932539ec4e39540fafd92362ba11f`
- Existing closed-bundle tests: `2898affe3ef7058607b3e1c5591fdf4d6a28c1fc`
- Existing C4 local harness tests: `20e4c28b1c8c3932f2af70140ef1636b44d3baaf`

## Behavioral boundaries

The original `nulvr.prove.synthetic-manifest.v0` remains `OBSERVED`-only. New `nulvr.prove.synthetic-manifest.v0.2a` pins manifest SHA-256 and exact source commit, enumerates every evidence file (including dotfiles), rejects symlinks and undeclared files, then evaluates only pre-pinned typed scalar `json_pointer_equals` and `sha256_equals` assertions using a flat AND. No regex or dynamically evaluated expressions. `ASSERTION_FAIL` exits 3 so negative semantic results cannot be mistaken for successful CI exit. Missing evidence/pins are `UNVERIFIABLE`, corrupted bundles `CHECK_ERROR`.

No source path imports the protected ledger writer; neither Layer A nor B can emit `VERIFIED`/`REFUTED`, deploy, merge or access production endpoints. This is local Node stdlib only.

## Independent acceptance still required

Re-fetch this **exact commit** and compare these exact Git blob hashes, run tests in a fresh sandbox, inspect bounded reads and TOCTOU concerns, verify protected anchor design separately, and check that no extra IO or escaped-root path can pass. A mutable fixture root is not a trusted production filesystem boundary. The owner has authorized **only code implementation and synthetic tests**, not promotion to an operational, separately credentialed PROVE service.

No GitHub workflow, pull request, Render deployment, main merge or paid resource was invoked by this checkpoint.
