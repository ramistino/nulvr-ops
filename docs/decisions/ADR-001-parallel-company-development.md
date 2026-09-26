# ADR-001 — Build the company independently of ALPS 4.18

**Decision:** Founder-directed strategy, 2026-09-26. **Implementation:** T2 preparation only; no Architecture Lock or production release granted by this ADR. The approved NULVR Constitution v1.0 remains frozen and unchanged.

## Context

ALPS is NULVR's first product, not the operating-system dependency for the whole company. The constitution's ALPS-first sequence controls qualification and activation of the trusted checker and Executive Orchestrator; it is **not** a ban on parallel local development of NULVR OPS. Previously, company work was repeatedly deferred behind ALPS 4.18.

## Decision

Keep two independent development lanes: COMPANY (NULVR OPS, contracts, synthetic PROVE fixtures, limited CI design) and PRODUCT (ALPS 4.18, load testing, read-only Laboratory UI). Development dependencies and activation gates are recorded in separate fields. No COMPANY development task may depend on an ALPS PRODUCT task; cross-product qualification, where genuinely required, appears only in activation gates.

Stage an offline, read-only planning board at `ops/portfolio.json`; validate it with `node --test tests/portfolio.test.mjs`, inspect it with `node checks/portfolio.mjs ops/portfolio.json`. It cannot write operational ledger verdicts, set a task to VERIFIED, assign real tool permissions, or perform any GitHub/Render action.

BUILD produces candidates on branches. PROVE begins independent reviews from acceptance criteria and primary artifacts. GUARD manages incident evidence, permissions and cost limits. A founder T2 Architecture Lock is still required before release of a new governance component, and CI must actually run successfully; a startup failure with zero jobs is not a passing test.

## Cost and rollout boundary

No paid runners, new Render services, automatic deployment, or manual workflow reruns. The repository's current CI triggers on PRs targeting `main`, so keep this implementation on a standalone branch **without opening a PR** until GitHub Actions billing eligibility and existing PR #7's `startup_failure` have been checked. Keep protected `main` unchanged.

The Executive Orchestrator stays disabled until a trusted checker is proven on synthetic evidence and then completes its founder-defined 14-day qualification on suitable ALPS evidence, including tamper and restart cases with no false VERIFIED verdicts; activation is separately authorized as a bounded read-only pilot.

## Alternatives rejected

- **Block the entire company until ALPS 4.18 PASS:** conflates product release order with company development and prevents independent progress.
- **Activate agents immediately:** undermines independent PROVE, fail-closed evidence and the no-merge/no-deploy/no-spend authorization boundary.
- **Create a second infrastructure stack now:** adds unnecessary cost and complexity before the local T2 candidate is proven.

## Revisit

Review after OPS's trusted checker passes its own independent verification and both development lanes have measured progress. If governance overhead exceeds the loss it prevents, simplify the process while preserving fail-closed boundaries.
