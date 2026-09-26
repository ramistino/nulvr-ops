import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {classifyProbeError, summarizeLiveness} from './ops/load-tests/local-harness.mjs';
const server = createServer((req,res) => {
  if (req.url === '/http503') {res.writeHead(503);res.end('temporarily down');return;}
  if (req.url === '/reset') {req.socket.destroy();return;}
  if (req.url === '/stall') {setTimeout(()=>{res.writeHead(200);res.end('late');},250);return;}
  res.writeHead(200);res.end('ok');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const samples=[];
async function probe(path) {
  const start=performance.now();
  try {
    const res=await fetch(base+path,{signal:AbortSignal.timeout(80)});
    await res.arrayBuffer();
    samples.push({status:res.status,kind:res.status===200?'HTTP_200':'HTTP_NON_200',latencyMs:Math.round(performance.now()-start)});
  } catch(err){const kind=classifyProbeError(err);samples.push({status:kind,kind,latencyMs:Math.round(performance.now()-start)});}
}
try {
  await probe('/live');await probe('/http503');await probe('/reset');await probe('/stall');
  const x=summarizeLiveness(samples);
  assert.equal(x.total,4);assert.equal(x.successes,1);assert.equal(x.httpNon200,1);
  assert.equal(x.transportErrors,1);assert.equal(x.timeouts,1);assert.equal(x.failures,3);assert.equal(x.livenessFailed,true);
  assert.ok(x.p50SuccessMs !== null && x.p95SuccessMs !== null && x.p99SuccessMs !== null);
  console.log(JSON.stringify({result:'PASS',target:'127.0.0.1 only',observedKinds:samples.map(x=>x.kind),summary:x}));
} finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
