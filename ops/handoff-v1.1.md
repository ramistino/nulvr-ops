# C2 handoff v1.1 — non-authoritative format

This schema supersedes v1.0 **only for new untrusted handoff records**; v1.0 remains preserved as a historical shape. Source PROVE review: [independent C2 review](https://github.com/ramistino/nulvr-ops/blob/940fce55598c45485c15758df9da54c4d37b2cb3/ops/prove/reviews/2026-09-26-c2-handoff.md).

- `ops/handoff-v1.1.schema.json` preserves existing required fields and adds mandatory `authority_required`.
- `status` permits only `PROPOSED`, `ACTIVE`, `BLOCKED`, `OBSERVED`, `UNVERIFIABLE` or `CHECK_ERROR`.
- `VERIFIED`, `REFUTED`, `RELEASED` and assertion results must not be entered as a handoff field; use separately approved evidence/verdict/release records.
- This is still a JSON Schema **shape check**. `authority_required` signals the next required review but grants no permission. A malicious actor can forge all other syntactically valid strings.
- The original `ops/examples/C2-handoff.json` needs no rewrite: it is already `PROPOSED` and explicitly requires PROVE.

No workflow activation, protected verdict writer, API permission, deploy, paid CI, main merge or production change is authorized by a schema update.
