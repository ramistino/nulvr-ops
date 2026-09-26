# C3 Architecture Lock v0.2a — bounded synthetic proposal

**Gate:** founder GO recorded 2026-09-26 for the narrowly scoped offline/synthetic implementation only, following explicit user instruction to execute. Independent PROVE implementation acceptance remains pending. This is an offline company capability independent of ALPS 4.18. It does not authorize a protected VERIFIED writer, autonomous PROVE agent, production access, CI run, deployment, purchase or merge.

This proposal incorporates the [independent source review](https://github.com/ramistino/nulvr-ops/blob/c79dad087ad5d38f125c197c18e87a1507fb0424/ops/prove/reviews/2026-09-26-c3-v02.md) of [v0.2](./architecture-lock-v0.2.md).

## Layer A: closed evidence bundle

- Pin the raw manifest SHA-256 and expected exact 40-hex source commit **outside** BUILD's mutable evidence. A matching user-supplied CLI value alone is not independently attested.
- Enumerate the whole evidence root, including hidden files and nested paths. Require declared files and reject undeclared files, symlinks, special nodes and root symlinks. If the manifest lives inside the root, exclude *only its exact canonical path*. Keep 16-file, 64-directory and depth-8 synthetic containment limits.
- Bound actual bytes read: 64 KiB manifest and 1 MiB cumulative evidence. Use no-follow descriptor reads and recheck descriptor identity before and after reading; stronger immutable private staging remains a prerequisite for trusted production use.
- Return OBSERVED only for a complete hash/size match; return UNVERIFIABLE on missing pins/evidence and CHECK_ERROR on tampering/schema/path errors.

A **branch-only, synthetic Layer-A hardening candidate** with five new negative tests exists at [commit ecb5664](https://github.com/ramistino/nulvr-ops/commit/ecb566497e21755404378e1ffb3ec8aaada49560). Local recorded result: 22/22 with the existing C4 tests; independent PROVE re-run still required. This candidate is not yet merged into the company track.

## Layer B: bounded deterministic assertions

Only after Layer A accepts a *pre-pinned* bundle, check at most 32 uniquely named, non-recursive assertions that were already included in the same approved manifest:

- json_pointer_equals: RFC 6901 pointer, at most 256 characters and 16 decoded segments. Strict typed comparison of JSON scalar string, finite number, boolean or null; objects/arrays and implicit coercions forbidden. Missing data means ASSERTION_FAIL; invalid pointer means CHECK_ERROR.
- sha256_equals: exact raw-byte digest comparison to a 64-hex value preapproved inside the manifest.
- all: one flat conjunction of named assertions. No nested expression evaluation.

**No regex in this phase.** The earlier proposed json_pointer_matches operator is explicitly deferred; limiting pattern length does not bound backtracking time.

Output: ASSERTION_PASS, ASSERTION_FAIL, UNVERIFIABLE or CHECK_ERROR, always with ledgerWrite=false and releaseAuthority=false. Never emit VERIFIED/REFUTED, and never persist a protected verdict from this implementation.

## Preconditions and acceptance

BUILD supplies exact source SHA, deterministic positive/negative synthetic fixtures and local reproducible tests. PROVE independently re-fetches the committed source, checks identities, reruns the tests and reviews both assertion semantics and the remaining filesystem race boundary. GUARD confirms no outbound network, protected ledger write, deployment, spending or permission expansion. The founder's **T2 GO covers only this offline synthetic candidate**; trusted write-path activation needs a separate approval.

**Decision: GO — offline synthetic v0.2a implementation ONLY.** A matching local test run does not grant protected-verdict authority. Independent PROVE source-bound acceptance is pending. No CI, main merge, ALPS/Render production action, paid resource, protected writer or Orchestrator activation.
