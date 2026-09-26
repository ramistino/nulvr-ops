import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validatePortfolio, summarizePortfolio } from '../checks/portfolio.mjs';

const base = JSON.parse(readFileSync(new URL('../ops/portfolio.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(base);
const task = (d, id) => d.tasks.find((item) => item.id === id);

test('the actual portfolio validates as a planning-only snapshot', () => {
  assert.equal(validatePortfolio(copy()).size, 8);
  assert.equal(summarizePortfolio(copy()).authority, 'PLANNING_ONLY');
});
test('company BUILD and PROVE can work while ALPS-418 is blocked', () => {
  const d = copy();
  assert.equal(task(d, 'ALPS-418').status, 'BLOCKED');
  assert.deepEqual(summarizePortfolio(d).company.independentWorkNow.map((x) => x.id), ['OPS-002', 'OPS-003']);
});
test('no COMPANY development dependency can point to an ALPS product task', () => {
  const d = copy(); task(d, 'OPS-003').dependsOn = ['ALPS-418'];
  assert.throws(() => validatePortfolio(d), /COMPANY_MUST_NOT_DEPEND_ON_PRODUCT/);
});
test('ALPS qualification is an activation gate, not a company development dependency', () => {
  const d = copy();
  assert.deepEqual(task(d, 'OPS-005').dependsOn, ['OPS-003', 'OPS-004']);
  assert.ok(task(d, 'OPS-005').activationGates.includes('TRUSTED_CHECKER_14_DAY_ALPS_QUALIFICATION'));
  assert.equal(validatePortfolio(d).size, 8);
});
test('fake VERIFIED or DONE statuses fail closed', () => {
  for (const status of ['VERIFIED', 'DONE', 'PASS']) {
    const d = copy(); task(d, 'OPS-002').status = status;
    assert.throws(() => validatePortfolio(d), /TASK_SCHEMA_INVALID/);
  }
});
test('duplicate task identities fail closed', () => {
  const d = copy(); d.tasks.push(structuredClone(d.tasks[0]));
  assert.throws(() => validatePortfolio(d), /DUPLICATE_TASK_ID/);
});
test('unknown dependencies fail closed', () => {
  const d = copy(); task(d, 'OPS-004').dependsOn = ['OPS-999'];
  assert.throws(() => validatePortfolio(d), /UNKNOWN_DEPENDENCY/);
});
test('circular dependencies fail closed', () => {
  const d = copy(); task(d, 'OPS-003').dependsOn = ['OPS-004'];
  assert.throws(() => validatePortfolio(d), /DEPENDENCY_CYCLE/);
});
test('a BLOCKED task must have a reason', () => {
  const d = copy(); delete task(d, 'OPS-001').blocker;
  assert.throws(() => validatePortfolio(d), /BLOCKER_REASON_REQUIRED/);
});
test('inconsistent blockers fail closed', () => {
  const d = copy(); task(d, 'OPS-002').blocker = { code: 'INVENTED' };
  assert.throws(() => validatePortfolio(d), /UNEXPECTED_BLOCKER/);
});
test('unknown owner and duplicate gates fail closed', () => {
  const d = copy(); task(d, 'OPS-002').owner = 'FOUNDER';
  assert.throws(() => validatePortfolio(d), /TASK_SCHEMA_INVALID/);
  const e = copy(); task(e, 'OPS-002').activationGates = ['PROVE_REVIEW', 'PROVE_REVIEW'];
  assert.throws(() => validatePortfolio(e), /DUPLICATE_DEPENDENCY_OR_GATE/);
});
test('CLI emits observation only and exits nonzero for malformed input', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nulvr-portfolio-'));
  try {
    const good = join(dir, 'good.json'); writeFileSync(good, JSON.stringify(base));
    const script = new URL('../checks/portfolio.mjs', import.meta.url);
    const ok = spawnSync(process.execPath, [script.pathname, good], { encoding: 'utf8' });
    assert.equal(ok.status, 0); assert.equal(JSON.parse(ok.stdout).authority, 'PLANNING_ONLY');
    const bad = join(dir, 'bad.json'); writeFileSync(bad, JSON.stringify({ schema: 'bad' }));
    const fail = spawnSync(process.execPath, [script.pathname, bad], { encoding: 'utf8' });
    assert.notEqual(fail.status, 0); assert.match(fail.stderr, /PORTFOLIO_SCHEMA_INVALID/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
