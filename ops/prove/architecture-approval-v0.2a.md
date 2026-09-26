# C3 T2 Architecture Lock — Founder GO

**Decision:** GO  
**Date:** 2026-09-26  
**Scope:** offline/synthetic C3 only.

The founder explicitly instructed execution after the source-bound PROVE review and the bounded v0.2a proposal. This GO authorizes BUILD to implement and test:
- closed-bundle Layer A;
- bounded typed scalar `json_pointer_equals`;
- raw `sha256_equals`;
- flat non-recursive `all` over at most 32 named assertions;
- local synthetic fixtures and offline tests.

This GO **does not authorize**: regex assertions, protected-ledger `VERIFIED` writes, production access, ALPS release authority, GitHub Actions reruns, deployment, spending, merge to main, autonomous PROVE, or Orchestrator activation.

**Pinned design baseline:** `fe0d42b2f7dcf7e205b545f1b88a8b0a2d280dd0` containing `ops/prove/architecture-lock-v0.2a.md`.

**Independent review evidence:** `c79dad087ad5d38f125c197c18e87a1507fb0424` on `prove/c3-v02-source-review-20260926`.

**Kill criteria:** any path that can forge assertion PASS from unpinned bytes, ignore undeclared evidence, escape the root, emit protected VERIFIED/REFUTED, access production/network resources, or exceed the bounded input model.

**Next gate:** BUILD implementation must be independently re-fetched and re-tested by PROVE before C3 can advance beyond synthetic candidate status.
