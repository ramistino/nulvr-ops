import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawnSync,spawn} from 'node:child_process';
const script=new URL('../checks/ledger.mjs',import.meta.url).pathname;
const tmp=()=>{const d=mkdtempSync(join(tmpdir(),'nulvr-'));return {file:join(d,'ledger.jsonl'),anchor:join(d,'anchor.json')}};
const run=(op,p,input,anch=true)=>spawnSync(process.execPath,[script,op,p.file],{input:input===undefined?undefined:JSON.stringify(input),encoding:'utf8',env:{...process.env,NULVR_ANCHOR_PATH:anch?p.anchor:''}});
const claim=(subject='s')=>({type:'CLAIM',status:'PENDING',subject});
test('empty ledger valid',()=>assert.equal(run('verify',tmp()).status,0));
test('reject forged verified string evidence',()=>assert.notEqual(run('append',tmp(),{type:'CHECK_RESULT',status:'VERIFIED',checker:'x',evidence:'trust me'}).status,0));
test('reject lowercase verified',()=>assert.notEqual(run('append',tmp(),{type:'CLAIM',status:'verified'}).status,0));
test('reject PASS',()=>assert.notEqual(run('append',tmp(),{type:'CLAIM',status:'PASS'}).status,0));
test('reject reserved hash',()=>assert.notEqual(run('append',tmp(),{...claim(),hash:'evil'}).status,0));
test('reject reserved seq',()=>assert.notEqual(run('append',tmp(),{...claim(),seq:99}).status,0));
test('append and verify',()=>{const p=tmp();assert.equal(run('append',p,claim()).status,0);assert.equal(run('verify',p).status,0)});
test('detect edit',()=>{const p=tmp();run('append',p,claim());writeFileSync(p.file,readFileSync(p.file,'utf8').replace('"s"','"t"'));assert.notEqual(run('verify',p).status,0)});
test('detect tail truncation with independent anchor',()=>{const p=tmp();run('append',p,claim());run('append',p,claim('t'));writeFileSync(p.file,readFileSync(p.file,'utf8').split('\n')[0]+'\n');assert.notEqual(run('verify',p).status,0)});
test('detect missing anchor',()=>{const p=tmp();run('append',p,claim());rmSync(p.anchor);assert.notEqual(run('verify',p).status,0)});
test('detect missing trailing newline',()=>{const p=tmp();run('append',p,claim());writeFileSync(p.file,readFileSync(p.file,'utf8').trimEnd());assert.notEqual(run('verify',p).status,0)});
test('20 simultaneous appends cannot silently lose records',async()=>{const p=tmp();const results=await Promise.all(Array.from({length:20},(_,i)=>new Promise(resolve=>{const child=spawn(process.execPath,[script,'append',p.file],{env:{...process.env,NULVR_ANCHOR_PATH:p.anchor}});child.stdin.end(JSON.stringify(claim(String(i))));child.on('close',resolve)})));const successful=results.filter(x=>x===0).length;assert.equal(run('verify',p).status,0);assert.equal(readFileSync(p.file,'utf8').trim().split('\n').length,successful);assert.ok(successful>0)});
// --- r2 additions (probes that passed against the candidate or r1 and should not have)
const headScript=new URL('../checks/main_head.mjs',import.meta.url).pathname;
test('r2-P1: REFUTED without trusted path is rejected',()=>assert.notEqual(run('append',tmp(),{type:'CHECK_RESULT',status:'REFUTED',checker:'x',subject:'m'}).status,0));
test('r2-P2: unset anchor fails closed on verify and append',()=>{const p=tmp();assert.notEqual(run('verify',p,undefined,false).status,0);assert.notEqual(run('append',p,claim(),false).status,0)});
test('r2-P7: forged VERIFIED with well-formed evidence is rejected',()=>assert.notEqual(run('append',tmp(),{type:'CHECK_RESULT',status:'VERIFIED',subject:'deployed.sha',checker:'checks/fake.mjs@deadbeef',evidence:[{uri:'https://render.com/x',sha256:'a'.repeat(64),fetchedAt:'2026-09-23T10:00:00Z'}]}).status,0));
test('r2-P4: 20 concurrent appends all succeed with bounded retry',async()=>{const p=tmp();const rc=await Promise.all(Array.from({length:20},(_,i)=>new Promise(r=>{const c=spawn(process.execPath,[script,'append',p.file],{env:{...process.env,NULVR_ANCHOR_PATH:p.anchor}});c.stdin.end(JSON.stringify(claim(String(i))));c.on('close',r)})));assert.equal(rc.filter(x=>x===0).length,20);assert.equal(JSON.parse(run('verify',p).stdout).seq,20)});
test('r2-P3: stale lock fails closed with LEDGER_BUSY',()=>{const p=tmp();run('append',p,claim());require_mkdir(p.file+'.lock');const r=spawnSync(process.execPath,[script,'append',p.file],{input:JSON.stringify(claim('z')),encoding:'utf8',env:{...process.env,NULVR_ANCHOR_PATH:p.anchor,NULVR_LOCK_WAIT_MS:'200'}});assert.match(r.stderr,/LEDGER_BUSY/);assert.equal(run('verify',p).status,0)});
import {mkdirSync as require_mkdir} from 'node:fs';
test('r2-P5: main_head never reports a verdict on network failure',()=>{const r=spawnSync(process.execPath,[headScript],{encoding:'utf8',env:{...process.env,GITHUB_API:'http://127.0.0.1:9'}});const o=JSON.parse(r.stdout);assert.equal(o.status,'UNVERIFIABLE');assert.equal(r.status,2)});
test('main_head: missing REPO fails closed',()=>{
  const env={...process.env};
  delete env.REPO;
  const r=spawnSync(process.execPath,[headScript],{
    encoding:'utf8',
    env
  });
  assert.equal(r.status,2);
  const o=JSON.parse(r.stdout);
  assert.equal(o.status,'UNVERIFIABLE');
  assert.equal(o.reason,'REPO_REQUIRED');
  assert.equal(o.source,null);
});
