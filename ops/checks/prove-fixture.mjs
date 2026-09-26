// C3 synthetic-only PROVE candidate. This NEVER emits VERIFIED or writes to the protected ledger.
// The manifest digest and expected Git SHA MUST arrive from an independent, pre-approved channel.
import {createHash, timingSafeEqual} from 'node:crypto';
import {openSync, readFileSync, closeSync, fstatSync, lstatSync, realpathSync, constants} from 'node:fs';
import {join, relative, isAbsolute, sep} from 'node:path';

const MAX_MANIFEST = 65536;
const MAX_EVIDENCE = 1048576;
const MAX_ENTRIES = 16;
const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const safeName = /^[A-Za-z0-9._/-]{1,200}$/;

function digest(data) { return createHash('sha256').update(data).digest('hex'); }
function matchesHex(a, b) {
  if (!SHA256.test(a || '') || !SHA256.test(b || '')) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
function fail(reason, status = 'CHECK_ERROR') {
  const err = new Error(reason);
  err.status = status;
  throw err;
}
function object(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}
function readBounded(path, limit) {
  let descriptor;
  try {
    if (!lstatSync(path).isFile()) fail('NOT_REGULAR_FILE');
    descriptor = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
    const before = fstatSync(descriptor);
    if (!before.isFile() || before.size > limit) fail('FILE_TOO_LARGE_OR_INVALID');
    const bytes = readFileSync(descriptor);
    const after = fstatSync(descriptor);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || bytes.length !== before.size) fail('FILE_CHANGED_DURING_READ');
    return bytes;
  } catch (error) {
    if (error?.status) throw error;
    if (error?.code === 'ENOENT') fail('EVIDENCE_MISSING', 'UNVERIFIABLE');
    fail('FILE_READ_FAILED');
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
}
function validate(manifest) {
  if (!object(manifest, ['schemaVersion', 'subject', 'pinnedCommit', 'entries'])
    || manifest.schemaVersion !== 'nulvr.prove.synthetic-manifest.v0'
    || typeof manifest.subject !== 'string' || !/^[A-Za-z0-9._:/-]{1,128}$/.test(manifest.subject)
    || typeof manifest.pinnedCommit !== 'string' || !COMMIT.test(manifest.pinnedCommit)
    || !Array.isArray(manifest.entries) || manifest.entries.length < 1 || manifest.entries.length > MAX_ENTRIES) {
    fail('MANIFEST_SCHEMA_INVALID');
  }
  const seen = new Set();
  let total = 0;
  for (const item of manifest.entries) {
    if (!object(item, ['path', 'sha256', 'size', 'kind'])
      || typeof item.path !== 'string' || !safeName.test(item.path)
      || isAbsolute(item.path) || item.path.split('/').some(p => p === '.' || p === '..' || p === '')
      || seen.has(item.path) || typeof item.sha256 !== 'string' || !SHA256.test(item.sha256)
      || !Number.isSafeInteger(item.size) || item.size < 1 || item.size > MAX_EVIDENCE
      || !['json', 'text'].includes(item.kind)) fail('MANIFEST_ENTRY_INVALID');
    seen.add(item.path);
    total += item.size;
    if (total > MAX_EVIDENCE) fail('MANIFEST_TOTAL_SIZE_LIMIT');
  }
}
function check(manifestPath, root, pinnedManifestSha, expectedCommit) {
  if (!SHA256.test(pinnedManifestSha || '') || !COMMIT.test(expectedCommit || '')) fail('INDEPENDENT_PIN_REQUIRED', 'UNVERIFIABLE');
  // The manifest and its expected digest must not come from the same untrusted source.
  const raw = readBounded(manifestPath, MAX_MANIFEST);
  if (!matchesHex(digest(raw), pinnedManifestSha)) fail('MANIFEST_PIN_MISMATCH');
  let manifest;
  try { manifest = JSON.parse(raw.toString('utf8')); }
  catch { fail('MANIFEST_JSON_INVALID'); }
  validate(manifest);
  if (manifest.pinnedCommit !== expectedCommit) fail('COMMIT_PIN_MISMATCH');

  let realRoot;
  try { realRoot = realpathSync(root); }
  catch { fail('ROOT_UNAVAILABLE', 'UNVERIFIABLE'); }
  let checked = 0;
  for (const item of manifest.entries) {
    const candidate = join(realRoot, ...item.path.split('/'));
    let actual;
    try { actual = realpathSync(candidate); }
    catch (error) {
      if (error.code === 'ENOENT') fail('EVIDENCE_MISSING', 'UNVERIFIABLE');
      fail('EVIDENCE_PATH_INVALID');
    }
    if (!relative(realRoot, actual) || relative(realRoot, actual).startsWith('..' + sep)
      || relative(realRoot, actual) === '..' || isAbsolute(relative(realRoot, actual))) fail('PATH_ESCAPES_ROOT');
    if (actual !== candidate) fail('SYMLINK_NOT_ALLOWED');
    const content = readBounded(actual, item.size);
    if (content.length !== item.size || !matchesHex(digest(content), item.sha256)) fail('EVIDENCE_DIGEST_MISMATCH');
    if (item.kind === 'json') {
      try { JSON.parse(content.toString('utf8')); }
      catch { fail('EVIDENCE_JSON_INVALID'); }
    }
    checked += 1;
  }
  // Matching untrusted local fixtures is only an observation, NOT trusted attestation.
  return {status: 'OBSERVED', subject: manifest.subject, checked, manifestSha256: digest(raw),
    pinnedCommit: expectedCommit, ledgerWrite: false, releaseAuthority: false};
}
try {
  const result = check(process.argv[2], process.argv[3], process.argv[4], process.argv[5]);
  console.log(JSON.stringify(result));
} catch (error) {
  console.log(JSON.stringify({status: error.status || 'CHECK_ERROR', reason: error.status ? error.message : 'UNHANDLED_CHECK_ERROR',
    ledgerWrite: false, releaseAuthority: false}));
  process.exitCode = error.status === 'UNVERIFIABLE' ? 2 : 1;
}
