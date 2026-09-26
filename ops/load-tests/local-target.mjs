// NULVR local-only synthetic target. Never connect to real ALPS, bind localhost only.
import http from 'node:http';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';

let server;
let active = false;
const histogram = monitorEventLoopDelay({ resolution: 10 });
histogram.enable();
process.once('message', (config) => {
  if (!config || !['blocked', 'responsive', 'work503', 'workReset', 'workTimeout', 'workInvalidBody'].includes(config.scenario) ||
      !Number.isInteger(config.workMs) || config.workMs < 200 || config.workMs > 1500) {
    process.send?.({ type: 'fatal', reason: 'INVALID_CHILD_CONFIG' });
    process.exitCode = 1;
    return;
  }
  server = http.createServer((req, res) => {
    res.setHeader('cache-control', 'no-store');
    if (req.method === 'GET' && req.url === '/live') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"status":"LIVE"}');
      return;
    }
    if (req.method === 'GET' && req.url === '/work') {
      if (active) { res.writeHead(429); res.end(); return; }
      active = true;
      const start = performance.now();
      const startCpu = process.cpuUsage();
      const finish = () => {
        if (config.scenario === 'workReset') res.destroy();
        else {
          res.writeHead(config.scenario === 'work503' ? 503 : 200,
            { 'content-type': 'application/json' });
          res.end(config.scenario === 'workInvalidBody' ? '{"status":"INCOMPLETE"}' :
            config.scenario === 'work503' ? '{"status":"UNAVAILABLE"}' :
            '{"status":"WORK_COMPLETE"}');
        }
        const elapsed = performance.now() - start;
        setTimeout(() => {
          const cpu = process.cpuUsage(startCpu);
          process.send?.({
            type: 'workComplete', elapsedMs: +elapsed.toFixed(1),
            eventLoopMaxDelayMs: +(histogram.max / 1e6).toFixed(1),
            rssBytes: process.memoryUsage().rss,
            peakRssKb: process.resourceUsage().maxRSS,
            cpuMicros: cpu.user + cpu.system
          });
          active = false;
        }, 30);
      };
      if (config.scenario === 'workTimeout') return; // Parent deadline kills child.
      if (config.scenario === 'blocked') {
        const until = performance.now() + config.workMs;
        while (performance.now() < until) {} // Intentional bounded synthetic CPU stall.
        finish();
      } else {
        setTimeout(finish, config.workMs); // Same eventual 200; event loop remains responsive.
      }
      return;
    }
    res.writeHead(404); res.end();
  });
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    process.send?.({ type: 'ready', host: '127.0.0.1', port: address.port });
  });
});
process.once('SIGTERM', () => {
  if (server) server.close(() => process.exit(0));
  else process.exit(0);
});
