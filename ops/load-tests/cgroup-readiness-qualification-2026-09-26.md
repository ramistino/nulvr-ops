# C4 read-only cgroup readiness — 2026-09-26

**Scope:** zero-cost, offline, read-only Linux cgroup v2 assessment. No cgroup creation, production workload, paid CI, deployment, merge, protected-ledger mutation, or authority.

**New source Git blobs, matched to exact local tested bytes:** `ops/load-tests/cgroup-readiness.mjs` `c280d43e5d9108a209b2a68ba1300eee678ab30e`; `ops/tests/cgroup-readiness.test.mjs` `fd9d6d34e64778f965734bf5000518c0379868f7`. The new source/test pair is committed to the company branch.

**Two complete local suite runs:** 23/23 passed each, zero failed/skipped, Node v22.16.0. Logs SHA-256 `cac81f1317ac970b47ee9e65e2cf51bfcf7793934db9cb45e9345ab53f812f6a` and `70388fa7a0936ce353011349491351eb7199182daeb59e8fc245b62ed92df831`.

**Observed environment:** cgroup v2 membership `/`; available controllers include `cpu` and `memory`; shared `memory.max=4294967296` bytes and `cpu.max=400000 100000`. `memory.events` readable. `cgroup.subtree_control` empty. File ownership/mode indicates only a **candidate** for delegation, not a proven ability to create a child cgroup. The previous local write-permission check found `cgroup.procs` not writable. No per-child resource limit was installed or verified.

**Fail-closed invariants:** the assessment always returns `operationalPass=false` and `perChildQuotaVerified=false`. It rejects missing required controllers and invalid membership paths. The 23 tests include the original C4 harness tests, experimental RLIMIT_AS tests, and three new read-only readiness tests. Experimental RLIMIT_AS=96 MiB remains rejected as a Node RSS-quota substitute.

**Disposition:** readiness assessor qualified as a local diagnostic, **not** as an OS quota enforcer. To proceed toward operational C4: an approved dedicated writable cgroup v2 environment or reviewed equivalent; per-child `memory.max`/`cpu.max`; observable `memory.events` and CPU throttling; bounded child cleanup; protected owner pin, immutable staging, approved workload budgets, independent reviewer signoff and separate operational T2 authorization.
