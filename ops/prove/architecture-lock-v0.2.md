# C3 — Trusted PROVE Checker Architecture Lock Candidate v0.2

**Decision requested:** approve only the offline/synthetic architecture below. Approval does not activate a production verifier, protected-ledger writer, network access, CI, deployment, spending or Orchestrator authority.

## 1. Separation of responsibilities

C3 is split into two deterministic layers.

### Layer A — Evidence Bundle Integrity Core

Purpose: answer only **"are these exact bytes the pre-pinned evidence bundle for this exact source identity?"**

Inputs:
- immutable manifest bytes;
- manifest SHA-256 supplied through an independent approval channel;
- expected exact Git commit supplied independently;
- isolated staging root.

Output:
- `OBSERVED` with bundle identity if every declared file matches;
- `UNVERIFIABLE` if required evidence/independent pins are unavailable;
- `CHECK_ERROR` for malformed, inconsistent or tampered input.

Layer A can never emit `VERIFIED` or `REFUTED`.

**Bundle semantics are CLOSED:** every regular file under the staging root, except the manifest when stored there, must be declared in the manifest. Undeclared files are an error. Nested directories are permitted only when every contained regular file is declared; symlinks, devices, sockets and path escapes are forbidden. This removes ambiguity about whether the manifest describes a subset or the complete bundle.

### Layer B — Fixed Assertion Adapters

Purpose: evaluate a pre-declared proposition against an already accepted Layer-A bundle.

The first adapter set is intentionally small:
- `json_pointer_equals`: strict JSON value equality at an RFC 6901 pointer;
- `json_pointer_matches`: value must be a string and match a bounded predeclared regular expression;
- `sha256_equals`: raw evidence bytes equal a predeclared SHA-256;
- `all`: every named assertion must pass.

Assertions are part of the **pre-pinned manifest bytes**. BUILD cannot change a proposition after seeing the evidence without changing the manifest digest and invalidating the independent pin.

Layer B produces `ASSERTION_PASS`, `ASSERTION_FAIL`, or `UNVERIFIABLE/CHECK_ERROR`; it still does **not** write `VERIFIED` to the protected ledger.

A future trusted verdict writer is a separate component and separate Architecture Lock. It may translate an independently accepted assertion result into a protected verdict only after checker identity, source identity, evidence bundle, policy version and protected anchor are all independently pinned.

## 2. Trust boundaries

- BUILD may create evidence, but cannot provide the only trusted pin for its own evidence.
- PROVE re-fetches source/evidence from primary locations or a separately controlled immutable store.
- The staging root is disposable input, never the system of record.
- The manifest digest, expected source commit and assertion policy version are fixed before execution.
- No checker code has merge, deploy, billing, secret-management or production-write permissions.
- C3 remains independent of ALPS 4.18; ALPS is only a later qualification target.

## 3. Filesystem hardening requirement

The current PoC's `realpathSync → open` sequence is not trusted against a hostile mutable filesystem. Before a trusted implementation:
1. stage evidence into a newly created private directory owned by the checker process;
2. reject symlinks and non-regular files while enumerating the complete tree;
3. open files with no-follow semantics where supported and verify descriptor metadata before/after reading;
4. enforce bounded file count, per-file bytes and total bytes actually read;
5. compute hashes from bytes read through the held descriptor;
6. treat any identity/size/mtime change during read as `CHECK_ERROR`;
7. for production qualification, prefer an immutable artifact/object identity over a shared mutable directory.

## 4. Acceptance criteria

A lock-qualified synthetic implementation must demonstrate:
- exact bundle enumeration rejects undeclared extra files;
- missing declared files and all symlinks fail closed;
- altered manifest/assertion/source pins fail closed;
- assertions cannot be introduced after the manifest pin;
- PASS and FAIL fixtures produce deterministic assertion results across two clean runs;
- malformed JSON/pointers/regex and oversized inputs fail closed;
- no output string or code path is capable of protected-ledger `VERIFIED`/release authority;
- no network or external process side effects;
- exact source SHA and raw result SHA-256 are retained for independent review.

## 5. Engineering budgets — provisional

Synthetic PoC only:
- manifest <= 64 KiB;
- <= 16 evidence files;
- <= 1 MiB cumulative evidence bytes actually read;
- assertions <= 32;
- regex source <= 256 bytes and no dynamic flags;
- local execution target <= 5 s per fixture set.

These are containment budgets, not performance claims. They remain provisional until measured.

## 6. Kill / rollback

Stop and return to design if any test can:
- forge an assertion PASS by modifying unpinned bytes;
- bypass closed-bundle enumeration;
- write a protected verdict;
- escape the staging root;
- access network/production resources;
- make checker behavior depend on BUILD narrative rather than pinned primary evidence.

Rollback is deletion/reversion of the company-branch C3 candidate. No production state exists to migrate.

## 7. Lock status

**CANDIDATE — NOT APPROVED.** Independent PROVE review of this v0.2 design is required before founder GO for implementation.
