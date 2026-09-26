import {createHash, timingSafeEqual} from 'node:crypto';
// Synthetic-only deterministic assertion evaluator. No ledger writer, network or release authority.
const SHA = /^[0-9a-f]{64}$/;
const NAME = /^[a-z][a-z0-9_-]{0,63}$/;
function error(reason) { const e = new Error(reason); e.status = 'CHECK_ERROR'; throw e; }
function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}
function scalar(value) {
  return value === null || typeof value === 'string' || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value));
}
function parsePointer(raw) {
  if (typeof raw !== 'string' || raw.length > 256) error('ASSERTION_POINTER_INVALID');
  if (raw === '') return [];
  if (!raw.startsWith('/')) error('ASSERTION_POINTER_INVALID');
  const segments = raw.slice(1).split('/');
  if (segments.length > 16 || segments.some(p => /~(?![01])/.test(p))) error('ASSERTION_POINTER_INVALID');
  return segments.map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));
}
export function validateAssertions(manifest) {
  if (!Array.isArray(manifest.assertions) || manifest.assertions.length === 0 || manifest.assertions.length > 32
    || !Array.isArray(manifest.all) || manifest.all.length !== manifest.assertions.length) error('ASSERTION_SCHEMA_INVALID');
  const files = new Map(manifest.entries.map(x => [x.path, x]));
  const names = new Set();
  for (const a of manifest.assertions) {
    if (!a || typeof a !== 'object' || Array.isArray(a) || !NAME.test(a.name || '') || names.has(a.name)
      || !files.has(a.file)) error('ASSERTION_SCHEMA_INVALID');
    names.add(a.name);
    if (a.op === 'json_pointer_equals') {
      if (!exactKeys(a, ['name', 'op', 'file', 'pointer', 'expected']) || files.get(a.file).kind !== 'json'
        || !scalar(a.expected)) error('ASSERTION_SCHEMA_INVALID');
      parsePointer(a.pointer);
    } else if (a.op === 'sha256_equals') {
      if (!exactKeys(a, ['name', 'op', 'file', 'expected']) || typeof a.expected !== 'string'
        || !SHA.test(a.expected)) error('ASSERTION_SCHEMA_INVALID');
    } else error('ASSERTION_OPERATOR_FORBIDDEN');
  }
  const members = new Set();
  for (const name of manifest.all) {
    if (typeof name !== 'string' || !names.has(name) || members.has(name)) error('ASSERTION_ALL_INVALID');
    members.add(name);
  }
  return true;
}
function pointerValue(doc, pointer) {
  let current = doc;
  for (const key of parsePointer(pointer)) {
    if (Array.isArray(current)) {
      if (!/^(0|[1-9][0-9]*)$/.test(key) || !Number.isSafeInteger(Number(key))
        || Number(key) >= current.length || !Object.hasOwn(current, key)) return {found: false};
      current = current[Number(key)];
    } else if (current !== null && typeof current === 'object' && Object.hasOwn(current, key)) {
      current = current[key];
    } else return {found: false};
  }
  return {found: true, value: current};
}
export function evaluateAssertions(manifest, evidenceBytes) {
  validateAssertions(manifest);
  const results = new Map();
  for (const assertion of manifest.assertions) {
    const bytes = evidenceBytes.get(assertion.file);
    if (!bytes) error('ASSERTION_EVIDENCE_MISSING');
    let pass;
    if (assertion.op === 'sha256_equals') {
      // Layer A already validated each byte hash against the pre-pinned manifest.
      const actual = createHash('sha256').update(bytes).digest();
      const expected = Buffer.from(assertion.expected, 'hex');
      pass = timingSafeEqual(actual, expected);
    } else {
      let doc;
      try { doc = JSON.parse(bytes.toString('utf8')); }
      catch { error('ASSERTION_EVIDENCE_JSON_INVALID'); }
      const found = pointerValue(doc, assertion.pointer);
      pass = found.found && scalar(found.value) && found.value === assertion.expected;
    }
    results.set(assertion.name, pass);
  }
  const assertions = manifest.all.map(name => ({name, passed: results.get(name)}));
  return {status: assertions.every(x => x.passed) ? 'ASSERTION_PASS' : 'ASSERTION_FAIL', assertions};
}
