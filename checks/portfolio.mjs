// NULVR OPS portfolio v0.1: read-only planning snapshot, NEVER a VERIFIED verdict.
// No network requests, subprocesses, side effects, or authority to transition tasks.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OWNERS = new Set(['BUILD', 'PROVE', 'GUARD']);
const LANES = new Set(['COMPANY', 'PRODUCT']);
const STATUSES = new Set(['PLANNED', 'READY', 'IN_PROGRESS', 'BLOCKED']);
const ID = /^(OPS|ALPS|LAB)-[0-9]{3}$/;
const fail = (code) => { throw new Error(code); };
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;

export function validatePortfolio(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc) ||
      doc.schema !== 'nulvr.ops.portfolio.v0.1' || doc.snapshotKind !== 'PLANNING_ONLY' ||
      !Array.isArray(doc.tasks) || doc.tasks.length === 0 || doc.tasks.length > 100) {
    fail('PORTFOLIO_SCHEMA_INVALID');
  }
  const byId = new Map();
  for (const task of doc.tasks) {
    if (!task || typeof task !== 'object' || Array.isArray(task) ||
        !ID.test(task.id ?? '') || !nonempty(task.title) ||
        !LANES.has(task.lane) || !OWNERS.has(task.owner) || !STATUSES.has(task.status) ||
        !Array.isArray(task.dependsOn) || !Array.isArray(task.activationGates) ||
        task.dependsOn.some((id) => typeof id !== 'string') ||
        task.activationGates.some((gate) => !nonempty(gate))) {
      fail('TASK_SCHEMA_INVALID');
    }
    if (task.status === 'BLOCKED' && (!task.blocker || !nonempty(task.blocker.code))) {
      fail('BLOCKER_REASON_REQUIRED');
    }
    if (task.status !== 'BLOCKED' && task.blocker != null) fail('UNEXPECTED_BLOCKER');
    if (byId.has(task.id)) fail('DUPLICATE_TASK_ID');
    if (new Set(task.dependsOn).size !== task.dependsOn.length ||
        new Set(task.activationGates).size !== task.activationGates.length) {
      fail('DUPLICATE_DEPENDENCY_OR_GATE');
    }
    byId.set(task.id, task);
  }
  for (const task of doc.tasks) {
    for (const id of task.dependsOn) {
      const dependency = byId.get(id);
      if (!dependency) fail('UNKNOWN_DEPENDENCY');
      if (task.lane === 'COMPANY' && dependency.lane === 'PRODUCT') {
        fail('COMPANY_MUST_NOT_DEPEND_ON_PRODUCT');
      }
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const walk = (id) => {
    if (visiting.has(id)) fail('DEPENDENCY_CYCLE');
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of byId.get(id).dependsOn) walk(dep);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of byId.keys()) walk(id);
  return byId;
}

export function summarizePortfolio(doc) {
  validatePortfolio(doc);
  const company = doc.tasks.filter((task) => task.lane === 'COMPANY');
  const product = doc.tasks.filter((task) => task.lane === 'PRODUCT');
  return {
    status: 'OBSERVED', authority: 'PLANNING_ONLY',
    company: {
      total: company.length,
      independentWorkNow: company.filter((task) =>
        task.dependsOn.length === 0 && ['READY', 'IN_PROGRESS'].includes(task.status)
      ).map((task) => ({ id: task.id, owner: task.owner, status: task.status })),
      blockers: company.filter((task) => task.status === 'BLOCKED')
        .map((task) => ({ id: task.id, code: task.blocker.code }))
    },
    products: {
      total: product.length,
      blockers: product.filter((task) => task.status === 'BLOCKED')
        .map((task) => ({ id: task.id, code: task.blocker.code }))
    },
    warning: 'Planning inventory only; no task completion, VERIFIED verdict, or agent permission implied.'
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) fail('USAGE_PORTFOLIO_FILE_REQUIRED');
    const doc = JSON.parse(readFileSync(resolve(process.argv[2]), 'utf8'));
    console.log(JSON.stringify(summarizePortfolio(doc), null, 2));
  } catch (error) {
    console.error(error.code || error.message || 'PORTFOLIO_ERROR');
    process.exitCode = 1;
  }
}
