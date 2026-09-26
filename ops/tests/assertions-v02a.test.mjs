import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, writeFileSync, rmSync, unlinkSync, symlinkSync, mkdirSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const script = new URL('../checks/prove-fixture.mjs', import.meta.url).pathname;
const sha = x => createHash('sha256').update(x).digest('hex');
const COMMIT = 'c'.repeat(40);
const baseline = {data: {items: [{name: 'alpha', score: 4, active: true}], 'slash/key': {'~': null}}, text: 'local fixture only\n'};
function eq(name, pointer, expected, file='evidence.json') {return {name, op: 'json_pointer_equals', file, pointer, expected};}
function hash(name, expected, file='note.txt') {return {name, op: 'sha256_equals', file, expected};}
function withFixture(callback) {
  const root = mkdtempSync(join(tmpdir(), 'nulvr-c3-v02a-'));
  const manifestPath = join(root, 'manifest.json');
  const data = Buffer.from(JSON.stringify(baseline.data));
  const text = Buffer.from(baseline.text);
  writeFileSync(join(root,'evidence.json'), data);
  writeFileSync(join(root,'note.txt'), text);
  const basic = [eq('name_ok','/items/0/name','alpha'), eq('score_ok','/items/0/score',4),
    eq('active_ok','/items/0/active',true), eq('null_ok','/slash~1key/~0',null), hash('hash_ok',sha(text))];
  let manifest = {schemaVersion:'nulvr.prove.synthetic-manifest.v0.2a', subject:'fixture.claim.validated', pinnedCommit:COMMIT,
    entries:[{path:'evidence.json',size:data.length,sha256:sha(data),kind:'json'},
      {path:'note.txt',size:text.length,sha256:sha(text),kind:'text'}],
    assertions:basic, all:basic.map(x=>x.name)};
  function run(edit=x=>x,{pin,commit=COMMIT,rootPath=root}={}) {
    const m = edit(structuredClone(manifest));
    const bytes = Buffer.from(JSON.stringify(m));
    writeFileSync(manifestPath, bytes);
    const r = spawnSync(process.execPath,[script,manifestPath,rootPath,pin===undefined?sha(bytes):pin,commit],
      {encoding:'utf8',timeout:6000});
    assert.equal(r.error,undefined);
    return {status:r.status, output:JSON.parse(r.stdout.trim()),stderr:r.stderr};
  }
  try {callback({root, manifestPath, data, text, manifest, run});}
  finally {rmSync(root,{recursive:true,force:true});}
}
test('five pre-pinned strict scalar/hash assertions pass; cannot write VERIFIED',()=>withFixture(f=>{
  const r=f.run(); assert.equal(r.status,0); assert.equal(r.output.status,'ASSERTION_PASS');
  assert.equal(r.output.assertions.length,5); assert.ok(r.output.assertions.every(x=>x.passed));
  assert.equal(r.output.ledgerWrite,false); assert.equal(r.output.releaseAuthority,false);
  assert.equal(existsSync(join(f.root,'ledger.jsonl')),false);
}));
test('wrong typed number => ASSERTION_FAIL and nonzero exit',()=>withFixture(f=>{
  const r=f.run(m=>{m.assertions[1].expected='4';return m;});
  assert.equal(r.status,3); assert.equal(r.output.status,'ASSERTION_FAIL');
  assert.deepEqual(r.output.assertions.filter(x=>!x.passed).map(x=>x.name),['score_ok']);
}));
test('false proposition does not become integrity failure',()=>withFixture(f=>{
  const r=f.run(m=>{m.assertions[0].expected='beta';return m;});
  assert.equal(r.status,3);assert.equal(r.output.status,'ASSERTION_FAIL');
}));
test('absent pointer is assertion failure',()=>withFixture(f=>{
  const r=f.run(m=>{m.assertions[0].pointer='/items/1/name';return m;});
  assert.equal(r.status,3);assert.equal(r.output.status,'ASSERTION_FAIL');
}));
test('objects and arrays are forbidden as expected values',()=>withFixture(f=>{
  const r=f.run(m=>{m.assertions[0].expected={name:'alpha'};return m;});
  assert.equal(r.status,1);assert.equal(r.output.reason,'ASSERTION_SCHEMA_INVALID');
}));
test('non-scalar actual value fails typed assertion',()=>withFixture(f=>{
  const r=f.run(m=>{m.assertions[0].pointer='/items/0';return m;});
  assert.equal(r.status,3);assert.equal(r.output.status,'ASSERTION_FAIL');
}));
test('malformed ~ escape is an error before reading evidence',()=>withFixture(f=>{
  const r=f.run(m=>{m.assertions[0].pointer='/bad~2';return m;});
  assert.equal(r.status,1);assert.equal(r.output.reason,'ASSERTION_POINTER_INVALID');
}));
test('pointer >256 chars or >16 segments rejected',()=>withFixture(f=>{
  for(const ptr of ['/'+('a'.repeat(256)),'/'+Array(17).fill('x').join('/')]) {
    const r=f.run(m=>{m.assertions[0].pointer=ptr;return m;});
    assert.equal(r.status,1);assert.equal(r.output.reason,'ASSERTION_POINTER_INVALID');
  }
}));
test('array leading-zero index and inherited Object.prototype property do not resolve',()=>withFixture(f=>{
  for(const ptr of ['/items/00/name','/constructor','/__proto__']) {
    const r=f.run(m=>{m.assertions[0].pointer=ptr;return m;});
    assert.equal(r.status,3);assert.equal(r.output.status,'ASSERTION_FAIL');
  }
}));
test('regex operator is forbidden',()=>withFixture(f=>{
  const r=f.run(m=>{m.assertions[0]={name:'name_ok',op:'json_pointer_matches',file:'evidence.json',pointer:'/items/0/name',expected:'(a+)+$'};return m;});
  assert.equal(r.status,1);assert.equal(r.output.reason,'ASSERTION_OPERATOR_FORBIDDEN');
}));
test('nested all and duplicate names rejected',()=>withFixture(f=>{
  for(const edit of [m=>{m.all=[['name_ok'],...m.all.slice(1)];return m;},m=>{m.assertions[1].name='name_ok';return m;}]) {
    const r=f.run(edit);assert.equal(r.status,1);assert.match(r.output.reason,/^ASSERTION_(SCHEMA|ALL)_INVALID$/);
  }
}));
test('omitting one assertion from all rejected',()=>withFixture(f=>{
  const r=f.run(m=>{m.all.pop();return m;});
  assert.equal(r.status,1);assert.equal(r.output.reason,'ASSERTION_SCHEMA_INVALID');
}));
test('more than 32 assertions rejected',()=>withFixture(f=>{
  const r=f.run(m=>{m.assertions=Array.from({length:33},(_,i)=>eq('n'+i,'/items/0/score',4));m.all=m.assertions.map(x=>x.name);return m;});
  assert.equal(r.status,1);assert.equal(r.output.reason,'ASSERTION_SCHEMA_INVALID');
}));
test('sha256_equals wrong pinned value gives ASSERTION_FAIL',()=>withFixture(f=>{
  const r=f.run(m=>{m.assertions[4].expected='f'.repeat(64);return m;});
  assert.equal(r.status,3);assert.equal(r.output.status,'ASSERTION_FAIL');
}));
test('changing pre-pinned assertions without updating independent pin fails before parsing',()=>withFixture(f=>{
  const prior=sha(Buffer.from(JSON.stringify(f.manifest)));
  const r=f.run(m=>{m.assertions[0].expected='forged';return m;},{pin:prior});
  assert.equal(r.status,1);assert.equal(r.output.reason,'MANIFEST_PIN_MISMATCH');
}));
test('changing expected source commit fails closed',()=>withFixture(f=>{
  const r=f.run(x=>x,{commit:'d'.repeat(40)});
  assert.equal(r.status,1);assert.equal(r.output.reason,'COMMIT_PIN_MISMATCH');
}));
test('undeclared dotfiles and nested files rejected even with valid assertions',()=>withFixture(f=>{
  writeFileSync(join(f.root,'.secret'),'x');
  let r=f.run();assert.equal(r.status,1);assert.equal(r.output.reason,'UNDECLARED_EVIDENCE');
  unlinkSync(join(f.root,'.secret'));
  mkdirSync(join(f.root,'sub'));writeFileSync(join(f.root,'sub','surprise'),'x');
  r=f.run();assert.equal(r.status,1);assert.equal(r.output.reason,'UNDECLARED_EVIDENCE');
}));
test('symlink cannot be used as declared evidence',()=>withFixture(f=>{
  unlinkSync(join(f.root,'note.txt'));symlinkSync('evidence.json',join(f.root,'note.txt'));
  const r=f.run();assert.equal(r.status,1);assert.equal(r.output.reason,'SYMLINK_NOT_ALLOWED');
}));
test('unavailable independently supplied manifest pin => UNVERIFIABLE',()=>withFixture(f=>{
  const r=f.run(x=>x,{pin:''});assert.equal(r.status,2);assert.equal(r.output.status,'UNVERIFIABLE');
}));
test('max source/schema exactness rejects undeclared assertion field',()=>withFixture(f=>{
  const r=f.run(m=>{m.assertions[0].extra='unused';return m;});
  assert.equal(r.status,1);assert.equal(r.output.reason,'ASSERTION_SCHEMA_INVALID');
}));
