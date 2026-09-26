# C3 — Offline PROVE checker: synthetic fixture PoC

**Scope:** company-side prototype only. ALPS Phase 4.18 is not a dependency. This is not the approved trusted checker and cannot emit a protected-ledger `VERIFIED` verdict.

## Design contract

1. The owner / separate acceptance system fixes an expected **40-hex commit SHA** and **SHA-256 digest of the manifest bytes** before the verifier reads the manifest. The two pins must arrive from an independent approved channel; supplying both from the same mutable worktree is not trusted verification.
2. The manifest binds the subject, pinned commit, and a bounded set of staged local evidence files to exact raw-byte SHA-256 hashes and sizes. The checker reopens files directly, not BUILD's narrative or reported test success.
3. On matching inputs, the checker emits **OBSERVED** (not VERIFIED), with manifest digest, checked count, and commit claim. Missing evidence and absent independent pins give **UNVERIFIABLE**; inconsistent data, tampering, malformed schema, symlinks, traversal and invalid JSON give **CHECK_ERROR**.
4. It never writes to `checks/ledger.mjs`, never touches the protected anchor, and contains no GitHub/Render network access, deployment, merge or spending capability.

## Local synthetic testing

```bash
node --test ops/tests/prove-fixture.test.mjs
node ops/checks/prove-fixture.mjs <manifest.json> <staged-root-dir> <preapproved-manifest-sha256> <preapproved-commit-sha>
```

Only explicitly staged, unprivileged local synthetic fixtures are appropriate. Limits: 64 KiB manifest, 16 evidence entries, 1 MiB cumulative evidence, exact bounded size per entry, regular files only, no symlinks, no path traversal. A mutable staging directory is **not** an adversarial filesystem isolation boundary; stronger openat/root isolation is required before trusted production use.

## Independent PROVE acceptance gates before C3 is considered complete

- Re-run tests **from the committed head** using an independent verification session. Observe that the committed checker never emits VERIFIED and cannot modify ledger or external infrastructure.
- Attack the acceptance manifest and evidence separately; require rejection of altered hashes, missing objects, invalid JSON, unpinned inputs, wrong pinned commit, and path escapes.
- Review filesystem race conditions and bound actual bytes read (not only the pre-read stat). Verify the source identity of every fetched piece of production evidence, not only a local manifest assertion.
- Obtain T2 Architecture Lock for the trusted PROVE write path and an independently protected anchor; reject self-approval of both checker and the evidence being inspected.
- **ALPS-based qualification is a later gate**. It does not block this synthetic company capability.

**Current result:** prototype code and tests staged on company branch; no CI workflow change or PR created while the existing zero-job startup failure is unresolved.
