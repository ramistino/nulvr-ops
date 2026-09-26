// C3 synthetic-only PROVE candidate. This NEVER emits VERIFIED or writes to the protected ledger.
// The manifest digest and expected Git SHA MUST arrive from an independent, pre-approved channel.
import {createHash, timingSafeEqual} from 'node:crypto';
import {openSync, readSync, closeSync, fstatSync, lstatSync, realpathSync, readdirSync, constants} from 'node:fs';
import {join, relative, isAbsolute, sep} from 'node:path';
import {validateAssertions, evaluateAssertions} from './assertions-v02a.mjs';

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
    // Bound the bytes actually read, even if a file grows after the first stat.
    const buffer = Buffer.alloc(limit + 1);
    let n = 0;
    while (n < buffer.length) {
      const count = readSync(descriptor, buffer, n, buffer.length - n, null);
      if (!count) break;
      n += count;
    }
    if (n > limit) fail('FILE_TOO_LARGE_OR_INVALID');
    const bytes = buffer.subarray(0, n);
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
  const v02a = manifest?.schemaVersion === 'nulvr.prove.synthetic-manifest.v0.2a';
  if (!object(manifest, v02a
    ? ['schemaVersion', 'subject', 'pinnedCommit', 'entries', 'assertions', 'all']
    : ['schemaVersion', 'subject', 'pinnedCommit', 'entries'])
    || (!v02a && manifest.schemaVersion !== 'nulvr.prove.synthetic-manifest.v0')
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
  if (v02a) validateAssertions(manifest);
}
// Closed evidence bundle: manifest describes every regular file in the root.
// If the manifest itself lives under root, exclude only that exact canonical file.
function verifyClosedBundle(realRoot, manifestPath, declaredPaths) {
  const manifestReal = realpathSync(manifestPath);
  const seen = new Set();
  let directories = 0;
  function walk(directory, prefix, depth) {
    if (depth > 8 || ++directories > 64) fail('BUNDLE_DIRECTORY_LIMIT');
    let items;
    try { items = readdirSync(directory, {withFileTypes: true}); }
    catch { fail('BUNDLE_ENUMERATION_FAILED'); }
    for (const item of items) {
      const rel = prefix ? `${prefix}/${item.name}` : item.name;
      const full = join(directory, item.name);
      const metadata = lstatSync(full);
      if (metadata.isSymbolicLink()) fail(declaredPaths.has(rel) ? 'SYMLINK_NOT_ALLOWED' : 'BUNDLE_UNSAFE_NODE');
      if (!metadata.isFile() && !metadata.isDirectory()) fail('BUNDLE_UNSAFE_NODE');
      if (metadata.isDirectory()) { walk(full, rel, depth + 1); continue; }
      if (full === manifestReal) continue;
      if (!declaredPaths.has(rel)) fail('UNDECLARED_EVIDENCE');
      if (seen.has(rel)) fail('DUPLICATE_EVIDENCE');
      seen.add(rel);
      if (seen.size > MAX_ENTRIES) fail('BUNDLE_FILE_LIMIT');
    }
  }
  walk(realRoot, '', 0);
  if (seen.size !== declaredPaths.size) fail('EVIDENCE_MISSING', 'UNVERIFIABLE');
  return seen.size;
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
  try {
    if (lstatSync(root).isSymbolicLink()) fail('BUNDLE_UNSAFE_ROOT');
    realRoot = realpathSync(root);
  } catch (error) {
    if (error?.status) throw error;
    fail('ROOT_UNAVAILABLE', 'UNVERIFIABLE');
  }
  // Avoid accepting a correct declared subset accompanied by undeclared data.
  verifyClosedBundle(realRoot, manifestPath, new Set(manifest.entries.map(item => item.path)));
  let checked = 0;
  const evidenceBytes = manifest.schemaVersion === 'nulvr.prove.synthetic-manifest.v0.2a' ? new Map() : null;
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
    if (evidenceBytes) evidenceBytes.set(item.path, content);
    checked += 1;
  }
  // A matching synthetic bundle is OBSERVED; v0.2a additionally evaluates *pre-pinned*
  // assertions. Neither path is a protected attestation or a release decision.
  const assertionResult = evidenceBytes ? evaluateAssertions(manifest, evidenceBytes) : {status: 'OBSERVED'};
  return {...assertionResult, subject: manifest.subject, checked, manifestSha256: digest(raw),
    pinnedCommit: expectedCommit, ledgerWrite: false, releaseAuthority: false};
}
try {
  const result = check(process.argv[2], process.argv[3], process.argv[4], process.argv[5]);
  console.log(JSON.stringify(result));
  if (result.status === 'ASSERTION_FAIL') process.exitCode = 3;
} catch (error) {
  console.log(JSON.stringify({status: error.status || 'CHECK_ERROR', reason: error.status ? error.message : 'UNHANDLED_CHECK_ERROR',
    ledgerWrite: false, releaseAuthority: false}));
  process.exitCode = error.status === 'UNVERIFIABLE' ? 2 : 1;
}
