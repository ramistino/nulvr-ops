// Read-only GitHub main-head observer. Output is an OBSERVATION, not a ledger verdict:
// the ledger refuses VERIFIED/REFUTED from generic append by design.
// r2 (from r1): sha256 of the raw response body, so the observation can later be re-checked.
import {createHash} from 'node:crypto';
const repo=process.env.REPO||'ramistino/alps-evidence-engine';
const api=process.env.GITHUB_API||'https://api.github.com';
const source=`${api}/repos/${repo}/commits/main`;
try{
  const response=await fetch(source,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/vnd.github+json',...(process.env.GITHUB_TOKEN?{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`}:{})}});
  if(!response.ok)throw Error(`HTTP_${response.status}`);
  const body=await response.text();let d;try{d=JSON.parse(body)}catch{throw Error('INVALID_JSON_BODY')}
  if(typeof d.sha!=='string'||!/^[0-9a-f]{40}$/.test(d.sha))throw Error('MISSING_OR_INVALID_SHA');
  console.log(JSON.stringify({status:'OBSERVED',subject:'main.headSha',sha:d.sha,evidence:[{uri:source,sha256:createHash('sha256').update(body).digest('hex'),fetchedAt:new Date().toISOString()}]}));
}catch(e){console.log(JSON.stringify({status:'UNVERIFIABLE',subject:'main.headSha',reason:e.name==='TimeoutError'?'TIMEOUT':e.message,source}));process.exitCode=2}
