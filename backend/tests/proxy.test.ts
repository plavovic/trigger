import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
const root = path.resolve(__dirname, '..');
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer(); server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { const address = server.address() as net.AddressInfo; server.close(() => resolve(address.port)); });
  });
}
async function ready(url: string, child: ChildProcess) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error('Smoke-test server exited before becoming ready');
    try { if ((await fetch(url)).ok) return; } catch { /* Wait for server startup. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('Smoke-test server did not become ready');
}
async function stop(child: ChildProcess) {
  if (child.exitCode !== null) return;
  const exited = new Promise<void>(resolve => child.once('exit', () => resolve()));
  child.kill(); await exited;
}
test('built Next.js pages and same-origin cookie/API proxy', async () => {
  assert.equal(process.env.TEST_DATABASE_ISOLATED, '1');
  const port = await freePort();
  const frontend = `http://localhost:${port}`;
  // The local production build uses this development-only proxy destination.
  const backendPort = process.env.SMOKE_API_PORT || '4000';
  const env = { ...process.env, NODE_ENV: 'test', FRONTEND_URL: frontend, PORT: backendPort };
  const api = spawn(process.execPath, ['dist/src/server.js'], { cwd: root, env, stdio: 'ignore' });
  const next = spawn(process.execPath, [path.join(root, '../node_modules/next/dist/bin/next'), 'start', '-p', String(port)], {
    cwd: path.resolve(root, '..'), env: { ...process.env, NODE_ENV: 'production', API_BACKEND_URL: `http://localhost:${backendPort}` }, stdio: 'ignore',
  });
  try {
    await ready(`http://localhost:${backendPort}/api/health`, api);
    await ready(frontend, next);
    for (const page of ['/', '/products', '/cart', '/about']) {
      const response = await fetch(frontend + page); assert.equal(response.status, 200);
      assert.match(await response.text(), /Triger/i);
    }
    const catalog = await fetch(frontend + '/api/products'); assert.equal(catalog.status, 200); assert.ok((await catalog.json()).length >= 6);
    const registration = await fetch(frontend + '/api/auth/register', { method: 'POST', headers: { Origin: frontend, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'proxy@example.test', password: randomBytes(24).toString('hex'), firstName: 'Proxy', lastName: 'Test' }) });
    assert.equal(registration.status, 201);
    const cookie = registration.headers.get('set-cookie')!; assert.match(cookie, /HttpOnly/);
    const me = await fetch(frontend + '/api/auth/me', { headers: { Cookie: cookie.split(';')[0] } }); assert.equal(me.status, 200); assert.equal((await me.json()).email, 'proxy@example.test');
    const logout = await fetch(frontend + '/api/auth/logout', { method: 'POST', headers: { Cookie: cookie.split(';')[0], Origin: frontend } }); assert.equal(logout.status, 204);
    assert.equal((await fetch(frontend + '/api/auth/me', { headers: { Cookie: cookie.split(';')[0] } })).status, 401);
  } finally { await Promise.all([stop(next), stop(api)]); }
});
