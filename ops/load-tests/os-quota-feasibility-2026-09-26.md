# C4 OS quota feasibility — local-only batch, 2026-09-26

**Scope:** standalone experimental Linux probe, no changes to the published C4 harness/target/test source, no ALPS target, CI, deployment, merge or spend.

- Baseline source blobs unchanged: harness `450ebeb5d99473ae9f60f3ae6ee30643e09f1af7`, target `75cd8361d7d7ffc1b961a9107d94c9a7b2ac41aa`, test `15b1897a84f99eb309e001142efd43f125d9706d`.
- Local experimental probe blob `cde7bb083181d187ced8132bd7f334ac2bb53d05`, new probe test blob `38883d9dc6d4a0f534bc48caef94fa824f01d8a3`. Source and tests are **local artifacts only**, not yet committed to the repository.
- Two complete local test runs (18 existing + 2 new): **20/20 PASS each**, zero failed/skipped. Local log SHA-256: `f0f99a3590c204b97c9a9291ee50554c3b9bb1bdca4b0cbc147a697e8c464a80` and `52488507538ddb29c610f0a3741b1b6b6205e25507ee9851c00b577a5339b4ca`.
- cgroup v2 is available and exposes `cpu` and `memory` controllers, but `/sys/fs/cgroup/cgroup.procs` is not writable in this execution environment. Existing shared environment limits (`memory.max=4294967296`, `cpu.max=400000 100000`) are **not dedicated C4 quotas**.
- Applying `RLIMIT_AS=96 MiB` to a fixed idle Node child produced `SIGSEGV`. `RLIMIT_AS` limits virtual address space, not RSS; it is **not** an acceptable substitute for a measured Node RSS quota at this setting.
- Probe execution was local, fixed child code, bounded duration, and always `operationalPass=false`. It does not grant independent PROVE/GUARD approval.

**Decision:** reject the naive 96 MiB `RLIMIT_AS` route; keep operational C4 BLOCKED. Next controlled qualification requires a dedicated writable cgroup v2 sandbox (or independently reviewed equivalent), per-child `memory.max` and `cpu.max`, observable OOM/throttle signals, process cleanup, protected pin and approved workload budgets. No authorization for paid infrastructure or production activation.
