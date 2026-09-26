# PROVE — C3 v0.2a implementation source review

**Reviewed source:** `6d3178711dadf84d777be28b34f1c0d198a9bc56`  
**Scope:** source-level adversarial review of the committed offline/synthetic implementation. No protected verdict, CI, production, deployment, merge or spending authority.

## Exact Git objects re-fetched

- `ops/checks/prove-fixture.mjs`: `272e38e40dd5b33446a33cd37c4143b73d78be18`
- `ops/checks/assertions-v02a.mjs`: `ecd2f3144c6da348081ef87904b751a98d70f3cb`
- `ops/tests/assertions-v02a.test.mjs`: `ca76b8f558f932539ec4e39540fafd92362ba11f`

BUILD records a local Node v22.16.0 run of **42/42**. That execution evidence is BUILD-originated and is not upgraded here into an independent runtime attestation. This review independently re-fetched and inspected the exact committed source.

## Source findings

**PASS — scope controls**
- v0.2a manifest assertions are inside the same manifest protected by the independently supplied manifest digest.
- Operators are allow-listed to `json_pointer_equals` and `sha256_equals`; regex and unknown operators are rejected.
- Expected JSON values are scalars only; numbers must be finite; no implicit coercion.
- JSON pointers are bounded to 256 characters / 16 segments and invalid `~` escapes are rejected.
- `all` is flat and requires every unique named assertion exactly once; assertion count is bounded to 32.
- Layer A validates complete bundle membership before Layer B evaluation; dotfiles/nested extras/symlinks are rejected.
- Evidence reads allocate at most `limit + 1` and recheck descriptor size/mtime after the read.
- Output explicitly carries `ledgerWrite:false` and `releaseAuthority:false`; assertion failure exits nonzero.

**GUARD static result — PASS for committed C3 source:** no imports or calls for HTTP/HTTPS/fetch, child processes, GitHub/Render, deployment, billing, protected-ledger append or external write were found in the two checker modules. The test module alone spawns the local Node process under test.

## Residual limits — do not promote to trusted production

1. Independent pin **provenance** is still an external contract: the CLI accepts the digest/commit as arguments and cannot prove who approved them.
2. Closed-bundle enumeration and later per-file opens are not a hostile-filesystem atomic snapshot. Private immutable staging remains required before trusted use.
3. JavaScript strict number equality follows IEEE-754 parsing. v0.2a therefore proves typed JSON-number equality as parsed by Node, not arbitrary-precision numeric semantics.
4. `sha256_equals` is intentionally redundant with Layer-A content identity when it targets the same pre-pinned file; it is safe but should not be described as an independent source attestation.
5. The 5-second target is a test-run containment target, not yet a measured production performance budget.

## Disposition

**SOURCE REVIEW: PASS for the founder-approved offline/synthetic v0.2a scope.**

This does not itself prove the recorded 42/42 runtime result independently. C3 may advance to **SOURCE_REVIEW_PASS_RUNTIME_PROVE_PENDING**. A fresh runtime re-execution from the exact commit remains required before synthetic qualification can be called independently reproduced.

No reason was found to widen authority or activate C5/C6/C7.
