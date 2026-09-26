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
