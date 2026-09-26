import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {runLocal} from '../load-tests/local-harness.mjs';
const sha256 = x => createHash('sha256').update(x).digest('hex');
async function fixture(scenario, alter = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'nulvr-local-load-'));
  const payload = Buffer.from('{"synthetic":true,"records":32}\n');
  const fixturePath = join(dir, 'fixture.json');
  const configPath = join(dir, 'config.json');
  writeFileSync(fixturePath, payload);
  const config = {schema: 'nulvr.load-local.v0', scenario, workMs: 500,
    probeEveryMs: 55, probeTimeoutMs: 110, maxDurationMs: 4500,
    pinnedCommit: 'a'.repeat(40), fixturePath, fixtureSha256: sha256(payload), ...alter};
  writeFileSync(configPath, JSON.stringify(config));
  return {dir, configPath};
}
test('responsive local work returns 200 and watchdog stays healthy', async () => {
  const f = await fixture('responsive');
  try {
    const result = await runLocal(f.configPath);
    assert.equal(result.status, 'OBSERVED');
    assert.equal(result.work.status, 200);
    assert.equal(result.liveness.livenessFailed, false);
    assert.equal(result.liveness.timeouts, 0);
    assert.equal(result.productionTarget, false);
    assert.equal(result.ledgerWrite, false);
  } finally {rmSync(f.dir, {recursive:true, force:true});}
});
test('delayed eventual 200 does NOT mask an independently observed liveness timeout', async () => {
  const f = await fixture('blocked');
  try {
    const result = await runLocal(f.configPath);
    assert.equal(result.status, 'OBSERVED');
    assert.equal(result.work.status, 200);
    assert.equal(result.liveness.livenessFailed, true);
    assert.ok(result.liveness.timeouts >= 1);
    assert.ok(result.resources.childEventLoopMaxDelayMs >= 200);
    assert.equal(result.releaseAuthority, false);
  } finally {rmSync(f.dir, {recursive:true, force:true});}
});
test('unapproved fixture hash rejects execution before target starts', async () => {
  const f = await fixture('responsive', {fixtureSha256: '0'.repeat(64)});
  try {await assert.rejects(() => runLocal(f.configPath), /FIXTURE_HASH_MISMATCH/);}
  finally {rmSync(f.dir, {recursive:true, force:true});}
});
test('unapproved or malformed scenario rejects execution before target starts', async () => {
  const f = await fixture('https://alps-evidence-engine-v01.onrender.com/api/live');
  try {await assert.rejects(() => runLocal(f.configPath), /CONFIG_INVALID/);}
  finally {rmSync(f.dir, {recursive:true, force:true});}
});
test('no unpinned build SHA', async () => {
  const f = await fixture('responsive', {pinnedCommit: ''});
  try {await assert.rejects(() => runLocal(f.configPath), /CONFIG_INVALID/);}
  finally {rmSync(f.dir, {recursive:true, force:true});}
});

// T2 local hardening negative cases: no remote target and no extra infrastructure.
import {unlinkSync, renameSync, symlinkSync, chmodSync, readFileSync} from 'node:fs';
import {classifyProbeError, summarizeLiveness, classifyTechnicalOutcome} from '../load-tests/local-harness.mjs';
test('oversized config fails before full materialization or child spawn', async () => {
  const f = await fixture('responsive');
  try {
    writeFileSync(f.configPath, 'x'.repeat(4097));
    await assert.rejects(() => runLocal(f.configPath), /INPUT_TOO_LARGE/);
  } finally {rmSync(f.dir, {recursive:true,force:true});}
});
test('oversized fixture fails before full materialization or child spawn', async () => {
  const f = await fixture('responsive');
  try {
    writeFileSync(join(f.dir,'fixture.json'), 'x'.repeat(65537));
    await assert.rejects(() => runLocal(f.configPath), /INPUT_TOO_LARGE/);
  } finally {rmSync(f.dir, {recursive:true,force:true});}
});
test('symlink fixture is refused even when target is local', async () => {
  const f = await fixture('responsive');
  try {
    renameSync(join(f.dir,'fixture.json'),join(f.dir,'real.json'));
    symlinkSync('real.json',join(f.dir,'fixture.json'));
    await assert.rejects(() => runLocal(f.configPath), /INPUT_NOT_REGULAR_FILE/);
  } finally {rmSync(f.dir, {recursive:true,force:true});}
});
test('symlink config is refused', async () => {
  const f = await fixture('responsive');
  try {
    renameSync(f.configPath,join(f.dir,'real-config.json'));
    symlinkSync('real-config.json',f.configPath);
    await assert.rejects(() => runLocal(f.configPath), /INPUT_NOT_REGULAR_FILE/);
  } finally {rmSync(f.dir, {recursive:true,force:true});}
});
test('fixture outside the private config root is refused', async () => {
  const f = await fixture('responsive');
  try {
    const config = JSON.parse(readFileSync(f.configPath,'utf8'));
    config.fixturePath = '/tmp/different-location.json';
    writeFileSync(f.configPath,JSON.stringify(config));
    await assert.rejects(() => runLocal(f.configPath), /FIXTURE_OUTSIDE_APPROVED_ROOT/);
  } finally {rmSync(f.dir, {recursive:true,force:true});}
});
test('shared or world-readable staging root is refused', async () => {
  const f = await fixture('responsive');
  try {
    chmodSync(f.dir, 0o755);
    await assert.rejects(() => runLocal(f.configPath), /LOCAL_ROOT_NOT_PRIVATE/);
  } finally {rmSync(f.dir, {recursive:true,force:true});}
});
test('watchdog classifies timeout separately from failed connection',()=> {
  assert.equal(classifyProbeError({name:'TimeoutError'}),'TIMEOUT');
  assert.equal(classifyProbeError({name:'AbortError'}),'TIMEOUT');
  assert.equal(classifyProbeError(Object.assign(new Error('connection reset'),{code:'ECONNRESET'})),'TRANSPORT_ERROR');
});
test('HTTP 503, timeout and transport errors each fail liveness and do not pollute successful latency percentiles',()=> {
  const liveness = summarizeLiveness([
    {kind:'HTTP_200',status:200,latencyMs:10},
    {kind:'HTTP_NON_200',status:503,latencyMs:9},
    {kind:'TIMEOUT',status:'TIMEOUT',latencyMs:110},
    {kind:'TRANSPORT_ERROR',status:'TRANSPORT_ERROR',latencyMs:4}
  ]);
  assert.equal(liveness.total,4);
  assert.equal(liveness.successes,1);
  assert.equal(liveness.httpNon200,1);
  assert.equal(liveness.timeouts,1);
  assert.equal(liveness.transportErrors,1);
  assert.equal(liveness.failures,3);
  assert.equal(liveness.p95SuccessMs,10);
  assert.equal(liveness.livenessFailed,true);
});

test('work 503 is a failure even when /live stays healthy', async () => {
 const f=await fixture('work503');
 try {const r=await runLocal(f.configPath);
 assert.equal(r.work.status,503); assert.equal(r.liveness.livenessFailed,false);
 assert.equal(r.technicalOutcome.workSucceeded,false);
 assert.ok(r.technicalOutcome.reasons.includes('WORK_HTTP_NON_200'));
 assert.equal(r.technicalOutcome.operationalPass,false);}
 finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('work reset is a transport failure and never fabricated as HTTP 200', async () => {
 const f=await fixture('workReset');
 try {const r=await runLocal(f.configPath);
 assert.equal(r.work.status,null); assert.equal(r.work.errorKind,'TRANSPORT_ERROR');
 assert.ok(r.technicalOutcome.reasons.includes('WORK_TRANSPORT_ERROR'));}
 finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('invalid HTTP 200 body fails work contract', async () => {
 const f=await fixture('workInvalidBody');
 try {const r=await runLocal(f.configPath);
 assert.equal(r.work.status,200);assert.equal(r.work.bodyValid,false);
 assert.ok(r.technicalOutcome.reasons.includes('WORK_INVALID_BODY'));}
 finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('work timeout is bounded and cannot produce operational PASS', async () => {
 const f=await fixture('workTimeout',{maxDurationMs:2500});
 try {const r=await runLocal(f.configPath);
 assert.equal(r.work.status,null);assert.equal(r.work.errorKind,'TIMEOUT');
 assert.ok(r.technicalOutcome.reasons.includes('WORK_TIMEOUT'));
 assert.equal(r.technicalOutcome.operationalPass,false);}
 finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('healthy work and liveness still cannot bypass unapproved provenance/resources',()=>{
 const x=classifyTechnicalOutcome({status:200,bodyValid:true},{livenessFailed:false});
 assert.equal(x.workSucceeded,true);assert.equal(x.operationalPass,false);
 assert.equal(x.resourceBudgetExceeded,null);assert.equal(x.ownerPinVerified,false);
});
