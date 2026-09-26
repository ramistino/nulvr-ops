# NULVR Constitution v1.0 — 26 September 2026

**Status: FROZEN as a governance policy; implementation remains staged.**

These two founder-approved documents form one constitution:

1. [Part I — Engineering Constitution](engineering.md): classification, seven engineering phases, risk gates, Architecture Lock, Engineering Budgets, release readiness and measurements.
2. [Part II — Operating Model](operating-model.md): Founder, BUILD / PROVE / GUARD, execution authority, assets, incidents and the Orchestrator activation gate.

## Provenance

This repository keeps **Markdown editions** of the two founder-supplied PDF source artifacts, not copies of their binary files. The documents retain their structure and operative decisions, while formatting is adapted for code review. Verify against the PDF sources whenever exact presentation or wording matters.

| Original approved PDF | Pages | SHA-256 |
|---|---:|---|
| الجزء الأول — الدستور الهندسي.pdf | 9 | 63e0308bc19ea6c7a57f9dd3ff8be23157e2364bc583f3f476b13a29367aeb94 |
| الجزء الثاني — نموذج التشغيل.pdf | 5 | ffa79639d4b0cae42d0508560377d64b576735e8302e858e484417b993a3c9bc |

Do not claim these PDF checksums cover the Markdown representations. The Markdown files receive their own Git blob identities; a future post-approval commit or release tag should refer to **the approved Git commit**, not a self-referential hash embedded in that same commit.

## Department instructions — design only

- [BUILD contract](contracts/build.md)
- [PROVE contract](contracts/prove.md)
- [GUARD contract](contracts/guard.md)

These are implementation templates for separate sessions. Merely storing them does **not** establish runtime isolation, an active multi-agent system, or new tool permissions.

## Activation order (mandatory)

**ALPS 4.18 PASS → reusable load-test environment → trusted PROVE checker → minimal governance CI → bounded read-only Orchestrator pilot.**

Preparation may run in parallel without new production expense or ALPS risk. A docs-only change does not itself satisfy Architecture Lock, activate a governance gate, create a verified checker, enable Orchestrator, or grant merge/deploy/spending rights.

**Source-control policy:** maintain this approved v1.0 without silently rewriting it. Proposed substantive changes require a new version and documented operational evidence. This change should follow the repository's normal PR and protected-branch checks; do not bypass failing CI to make this document appear deployed.
