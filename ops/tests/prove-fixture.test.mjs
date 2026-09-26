import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, writeFileSync, rmSync, unlinkSync, symlinkSync, mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const script = new URL('../checks/prove-fixture.mjs', import.meta.url).pathname;
const hash = value => createHash('sha256').update(value).digest('hex');
const COMMIT = 'a'.repeat(40);
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'nulvr-prove-'));
  const bytes = Buffer.from('{"records":3,"researchOnly":true}\n');
  const evidencePath = join(root, 'evidence.json');
  const manifestPath = join(root, 'manifest.json');
  writeFileSync(evidencePath, bytes);
  const manifest = {
    schemaVersion: 'nulvr.prove.synthetic-manifest.v0',
    subject: 'fixture.synthetic-alps',
    pinnedCommit: COMMIT,
    entries: [{path: 'evidence.json', sha256: hash(bytes), size: bytes.length, kind: 'json'}]
  };
  function writeManifest(data = manifest) {
    const body = JSON.stringify(data);
    writeFileSync(manifestPath, body);
    return hash(Buffer.from(body));
  }
  const pinned = writeManifest();
  function run({pin = pinned, commit = COMMIT, rootPath = root} = {}) {
    const result = spawnSync(process.execPath, [script, manifestPath, rootPath, pin, commit], {
      encoding: 'utf8', timeout: 6000
    });
    assert.equal(result.error, undefined);
    const output = JSON.parse(result.stdout.trim());
    return {result, output};
  }
  return {root, manifest, bytes, evidencePath, manifestPath, pinned, writeManifest, run};
}
function withFixture(fn) {
  const f = fixture();
  try { fn(f); }
  finally { rmSync(f.root, {recursive: true, force: true}); }
}
test('synthetic pinned fixture is OBSERVED only and does not write VERIFIED', () => withFixture(f => {
  const {result, output} = f.run();
  assert.equal(result.status, 0);
  assert.equal(output.status, 'OBSERVED');
  assert.equal(output.checked, 1);
  assert.equal(output.ledgerWrite, false);
  assert.equal(output.releaseAuthority, false);
  assert.equal(output.pinnedCommit, COMMIT);
}));
test('missing independent manifest pin fails closed as UNVERIFIABLE', () => withFixture(f => {
  const {result, output} = f.run({pin: ''});
  assert.equal(result.status, 2);
  assert.equal(output.status, 'UNVERIFIABLE');
  assert.equal(output.reason, 'INDEPENDENT_PIN_REQUIRED');
}));
test('tampered manifest never passes its prior external pin', () => withFixture(f => {
  f.writeManifest({...f.manifest, subject: 'forged'});
  const {result, output} = f.run();
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'MANIFEST_PIN_MISMATCH');
}));
test('wrong expected commit never passes', () => withFixture(f => {
  const {result, output} = f.run({commit: 'b'.repeat(40)});
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'COMMIT_PIN_MISMATCH');
}));
test('tampered evidence is rejected even when manifest remains pinned', () => withFixture(f => {
  writeFileSync(f.evidencePath, '{"records":4,"researchOnly":true}\n');
  const {result, output} = f.run();
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'EVIDENCE_DIGEST_MISMATCH');
}));
test('missing evidence cannot turn into a success', () => withFixture(f => {
  unlinkSync(f.evidencePath);
  const {result, output} = f.run();
  assert.equal(result.status, 2);
  assert.equal(output.status, 'UNVERIFIABLE');
  assert.equal(output.reason, 'EVIDENCE_MISSING');
}));
test('malformed evidence JSON is rejected even with a matching digest', () => withFixture(f => {
  const malformed = Buffer.from('{"records":3');
  writeFileSync(f.evidencePath, malformed);
  const updated = {...f.manifest, entries: [{...f.manifest.entries[0], sha256: hash(malformed), size: malformed.length}]};
  const pin = f.writeManifest(updated);
  const {result, output} = f.run({pin});
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'EVIDENCE_JSON_INVALID');
}));
test('path traversal is rejected before reading external data', () => withFixture(f => {
  const updated = {...f.manifest, entries: [{...f.manifest.entries[0], path: '../secret.json'}]};
  const pin = f.writeManifest(updated);
  const {result, output} = f.run({pin});
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'MANIFEST_ENTRY_INVALID');
}));
test('symlink evidence is rejected even when its bytes match', () => withFixture(f => {
  writeFileSync(join(f.root, 'original.json'), f.bytes);
  unlinkSync(f.evidencePath);
  symlinkSync('original.json', f.evidencePath);
  const {result, output} = f.run();
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'SYMLINK_NOT_ALLOWED');
}));
test('oversized declared evidence fails before allocation', () => withFixture(f => {
  const updated = {...f.manifest, entries: [{...f.manifest.entries[0], size: 1048577}]};
  const pin = f.writeManifest(updated);
  const {result, output} = f.run({pin});
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'MANIFEST_ENTRY_INVALID');
}));
test('unavailable root is UNVERIFIABLE', () => withFixture(f => {
  const {result, output} = f.run({rootPath: join(f.root, 'missing-root')});
  assert.equal(result.status, 2);
  assert.equal(output.status, 'UNVERIFIABLE');
}));
test('duplicate evidence path is rejected in manifest', () => withFixture(f => {
  const updated = {...f.manifest, entries: [f.manifest.entries[0], f.manifest.entries[0]]};
  const pin = f.writeManifest(updated);
  const {result, output} = f.run({pin});
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'MANIFEST_ENTRY_INVALID');
}));

test('undeclared extra regular evidence is rejected by closed-bundle verifier', () => withFixture(f => {
  writeFileSync(join(f.root, 'extra.json'), '{}');
  const {result, output} = f.run();
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'UNDECLARED_EVIDENCE');
}));
test('undeclared hidden file is rejected, not silently ignored', () => withFixture(f => {
  writeFileSync(join(f.root, '.hidden'), 'untrusted');
  const {result, output} = f.run();
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'UNDECLARED_EVIDENCE');
}));
test('undeclared symlink in evidence root is rejected', () => withFixture(f => {
  symlinkSync('evidence.json', join(f.root, 'extra-link'));
  const {result, output} = f.run();
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'BUNDLE_UNSAFE_NODE');
}));

test('undeclared nested evidence is rejected by recursive enumeration', () => withFixture(f => {
  mkdirSync(join(f.root, 'nested'));
  writeFileSync(join(f.root, 'nested', 'unexpected.json'), '{}');
  const {result, output} = f.run();
  assert.equal(result.status, 1);
  assert.equal(output.reason, 'UNDECLARED_EVIDENCE');
}));
test('symlink evidence root is rejected even if its contents are valid', () => withFixture(f => {
  const alias = f.root + '-symlink';
  try {
    symlinkSync(f.root, alias, 'dir');
    const {result, output} = f.run({rootPath: alias});
    assert.equal(result.status, 1);
    assert.equal(output.reason, 'BUNDLE_UNSAFE_ROOT');
  } finally {rmSync(alias, {force: true});}
}));
