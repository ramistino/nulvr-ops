// C4 OFFLINE PoC. Independent parent watchdog detects blocking despite late work HTTP 200.
// Node stdlib only, 127.0.0.1 target only, no production endpoint or ledger authority.
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { performance } from 'node:perf_hooks';

const own = fileURLToPath(import.meta.url);
const target = join(dirname(own), 'local-target.mjs');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const hex64 = /^[a-f0-9]{64}$/;
const hex40 = /^[a-f0-9]{40}$/;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const deadline = (promise, ms, reason) => Promise.race([promise, new Promise((_, reject) => {
  const timeout = setTimeout(() => reject(new Error(reason)), ms);
  timeout.unref();
})]);
function exactKeys(input, keys) {
  return input && typeof input === 'object' && !Array.isArray(input) &&
    Object.keys(input).sort().join(',') === [...keys].sort().join(',');
}
function loadConfig(configPath) {
  const raw = readFileSync(configPath);
  if (raw.length > 4096) throw Error('CONFIG_TOO_LARGE');
  let config;
  try { config = JSON.parse(raw); } catch { throw Error('CONFIG_JSON_INVALID'); }
  if (!exactKeys(config, ['schema', 'scenario', 'workMs', 'probeEveryMs', 'probeTimeoutMs', 'maxDurationMs', 'pinnedCommit', 'fixturePath', 'fixtureSha256']) ||
      config.schema !== 'nulvr.load-local.v0' || !['responsive', 'blocked'].includes(config.scenario) ||
      !Number.isInteger(config.workMs) || config.workMs < 200 || config.workMs > 1500 ||
      !Number.isInteger(config.probeEveryMs) || config.probeEveryMs < 25 || config.probeEveryMs > 250 ||
      !Number.isInteger(config.probeTimeoutMs) || config.probeTimeoutMs < 40 || config.probeTimeoutMs > 350 ||
      !Number.isInteger(config.maxDurationMs) || config.maxDurationMs < 2500 || config.maxDurationMs > 6000 ||
      !hex40.test(config.pinnedCommit) || !hex64.test(config.fixtureSha256) ||
      typeof config.fixturePath !== 'string' || config.fixturePath.length === 0) throw Error('CONFIG_INVALID');
  const fixture = readFileSync(config.fixturePath);
  if (fixture.length === 0 || fixture.length > 65536) throw Error('FIXTURE_SIZE_INVALID');
  if (sha256(fixture) !== config.fixtureSha256) throw Error('FIXTURE_HASH_MISMATCH');
  return { config, configSha256: sha256(raw) };
}
const p95 = values => values.length ? +values.toSorted((a, b) => a - b)[Math.ceil(values.length * 0.95) - 1].toFixed(1) : null;
export async function runLocal(configPath) {
  const {config, configSha256} = loadConfig(configPath);
  const child = spawn(process.execPath, ['--max-old-space-size=96', target], {
    stdio: ['ignore', 'ignore', 'pipe', 'ipc'], env: {PATH: process.env.PATH || '', NODE_ENV: 'test'}
  });
  let errText = '';
  child.stderr?.on('data', data => {errText += String(data).slice(0, 200);});
  let readyResolve, readyReject, metricsResolve;
  const readyPromise = new Promise((resolve, reject) => {readyResolve = resolve; readyReject = reject;});
  const metricsPromise = new Promise(resolve => {metricsResolve = resolve;});
  child.on('error', readyReject);
  child.on('exit', (code, signal) => readyReject(new Error(`TARGET_EXIT_${code ?? signal}`)));
  child.on('message', msg => {
    if (msg.type === 'ready') readyResolve(msg);
    if (msg.type === 'fatal') readyReject(new Error(msg.reason));
    if (msg.type === 'workComplete') metricsResolve(msg);
  });
  const overall = performance.now();
  child.send({scenario: config.scenario, workMs: config.workMs});
  try {
    const ready = await deadline(readyPromise, 1800, 'TARGET_READY_TIMEOUT');
    if (ready.host !== '127.0.0.1' || !Number.isInteger(ready.port)) throw Error('TARGET_NOT_LOCAL');
    const base = `http://127.0.0.1:${ready.port}`;
    const pre = await fetch(base + '/live', {signal: AbortSignal.timeout(600)});
    if (pre.status !== 200) throw Error('PRE_LIVE_FAILED');
    // Allow at least two histogram sampling ticks before the synthetic stall.
    await sleep(35);
    const probes = [];
    let workFinished = false;
    const work = (async () => {
      const started = performance.now();
      const response = await fetch(base + '/work', {signal: AbortSignal.timeout(config.maxDurationMs - 400)});
      await response.arrayBuffer();
      workFinished = true;
      return {status: response.status, latencyMs: +(performance.now() - started).toFixed(1)};
    })();
    const watchdog = (async () => {
      while (!workFinished && performance.now() - overall < config.maxDurationMs - 200) {
        const t0 = performance.now();
        try {
          const response = await fetch(base + '/live', {signal: AbortSignal.timeout(config.probeTimeoutMs)});
          await response.arrayBuffer();
          probes.push({status: response.status, latencyMs: +(performance.now() - t0).toFixed(1)});
        } catch {
          probes.push({status: 'TIMEOUT', latencyMs: +(performance.now() - t0).toFixed(1)});
        }
        await sleep(config.probeEveryMs);
      }
    })();
    const result = await deadline(work, config.maxDurationMs - 200, 'WORK_TIMEOUT');
    await deadline(watchdog, 1000, 'WATCHDOG_TIMEOUT');
    const metrics = await deadline(metricsPromise, 600, 'CHILD_METRICS_MISSING');
    const timeouts = probes.filter(p => p.status === 'TIMEOUT').length;
    const successes = probes.filter(p => p.status === 200).map(p => p.latencyMs);
    const summary = {
      schema: 'nulvr.load-local-result.v0', status: 'OBSERVED', authority: 'SYNTHETIC_ONLY',
      pinnedCommit: config.pinnedCommit, configSha256, fixtureSha256: config.fixtureSha256,
      toolSha256: sha256(Buffer.concat([readFileSync(own), readFileSync(target)])),
      scenario: config.scenario,
      workload: {workMs: config.workMs, probeEveryMs: config.probeEveryMs, probeTimeoutMs: config.probeTimeoutMs},
      work: result,
      liveness: {total: probes.length, successes: successes.length, timeouts, p95SuccessMs: p95(successes),
        livenessFailed: timeouts > 0 || probes.some(p => p.status !== 200)},
      resources: {childEventLoopMaxDelayMs: metrics.eventLoopMaxDelayMs,
        childRssBytesAfterWork: metrics.rssBytes, childPeakRssKb: metrics.peakRssKb,
        childWorkCpuMicros: metrics.cpuMicros},
      ledgerWrite: false, releaseAuthority: false, productionTarget: false
    };
    return { ...summary, resultSha256: sha256(JSON.stringify(summary)) };
  } finally {
    child.kill('SIGTERM');
    const hardStop = setTimeout(() => child.kill('SIGKILL'), 250);
    hardStop.unref();
    child.once('exit', () => clearTimeout(hardStop));
  }
}
if (process.argv[1] === own) {
  try {
    if (process.argv.length !== 3) throw Error('CONFIG_PATH_REQUIRED');
    console.log(JSON.stringify(await runLocal(process.argv[2]), null, 2));
  } catch (error) {
    console.log(JSON.stringify({status: 'CHECK_ERROR', reason: error.message,
      ledgerWrite: false, releaseAuthority: false, productionTarget: false}));
    process.exitCode = 1;
  }
}
