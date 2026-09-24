# nulvr-ops ledger — r2 (single merged version)

Status: LOCAL PROTOTYPE, NOT DEPLOYED. Pilot NOT PASS. No ALPS changes, no paid resources.

Base: the independently written "hardened candidate". r1 is superseded: r1 accepted a forged VERIFIED
(`deployed.sha`, fabricated but well-formed evidence) because it validated evidence shape, not provenance.

Run: `node --test tests/*.test.mjs` (18 tests).
Append: `echo '{"type":"CLAIM","status":"PENDING","subject":"x"}' | NULVR_ANCHOR_PATH=/protected/anchor.json node checks/ledger.mjs append ledger/ledger.jsonl`
Verify: `NULVR_ANCHOR_PATH=/protected/anchor.json node checks/ledger.mjs verify ledger/ledger.jsonl`

Security model
- Generic append never records a verdict: VERIFIED and REFUTED are both rejected. Allowed: PENDING, UNVERIFIABLE, CHECK_ERROR, INFO.
- A verdict requires a trusted checker write path. NOT IMPLEMENTED. Until it exists the ledger cannot record VERIFIED, by design.
- NULVR_ANCHOR_PATH is mandatory. Unset = fail closed. The anchor only detects truncation if the ledger writer cannot rewrite it.
- Lock: bounded retry (NULVR_LOCK_WAIT_MS, default 5000), then LEDGER_BUSY. A stale lock after a crash is never auto-removed.
- Crash between ledger append and anchor update = ANCHOR_MISMATCH until manual reconciliation. No automatic repair.
- main_head.mjs emits OBSERVED (with sha256 of the response body) or UNVERIFIABLE. It is an observation, not a ledger verdict,
  and says nothing about the Render deployment SHA.

Changes vs candidate (each backed by a test that failed on the candidate)
- REFUTED removed from generic append (was writable with checker:"x" and no evidence).
- Unset anchor now fails closed (truncation was silently accepted).
- Bounded lock retry: 20/20 concurrent appends succeed (candidate: 2/20, failing closed).
- Ported from r1: fsync after append, sha256 of GitHub response body, extended ledger types.

Open: trusted verdict write path; protected anchor storage; N1–N8 suite; CI annotation reader; Render SHA; protected-contracts checker.
CI smoke test — verify pull request checks.
