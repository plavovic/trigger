// Starts a disposable real PostgreSQL cluster. Never connects to an existing database.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { randomBytes } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const bin = process.env.PG_BIN || (process.platform === 'win32' ? 'C:/Program Files/PostgreSQL/18/bin' : '');
const executable = name => bin ? path.join(bin, name + (process.platform === 'win32' ? '.exe' : '')) : name;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'triger-postgres-test-'));
const data = path.join(temp, 'data');
const pwfile = path.join(temp, 'password');
const password = randomBytes(32).toString('hex');
const username = 'test_' + randomBytes(8).toString('hex');
const database = 'triger_test_' + randomBytes(8).toString('hex');
fs.writeFileSync(pwfile, password, { mode: 0o600 });
let started = false;
function run(file, args, env = process.env, options = {}) {
  const result = spawnSync(file, args, { cwd: root, env, encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) {
    // Redact the generated credential if a tool includes its connection URL.
    const detail = String(result.stderr || result.error?.message || result.stdout || '').replaceAll(password, '[REDACTED]');
    throw new Error(`${path.basename(file)} failed: ${detail}`);
  }
  return result.stdout;
}
function nodeTool(name, args, env) { return run(process.execPath, [path.join(root, 'node_modules', name), ...args], env, { stdio: 'inherit' }); }
async function main() {
  const port = await new Promise((resolve, reject) => {
    const server = net.createServer(); server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); });
  });
  run(executable('initdb'), ['-D', data, '-U', username, '--pwfile', pwfile, '--auth=scram-sha-256', '--encoding=UTF8', '--no-locale']);
  fs.unlinkSync(pwfile);
  run(executable('pg_ctl'), ['-D', data, '-l', path.join(temp, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], process.env, { stdio: 'inherit' });
  started = true;
  run(executable('createdb'), ['-h', '127.0.0.1', '-p', String(port), '-U', username, database], { ...process.env, PGPASSWORD: password });
  const url = new URL('postgresql://127.0.0.1');
  url.username = username; url.password = password; url.port = String(port); url.pathname = '/' + database;
  const env = { ...process.env, DATABASE_URL: url.href, DIRECT_URL: url.href, NODE_ENV: 'test', FRONTEND_URL: 'http://localhost:3000', SHIPPING_AMOUNT: '4.90', TEST_DATABASE_ISOLATED: '1' };
  nodeTool('prisma/build/index.js', ['validate'], env);
  nodeTool('prisma/build/index.js', ['generate'], env);
  nodeTool('prisma/build/index.js', ['migrate', 'deploy'], env);
  nodeTool('prisma/build/index.js', ['migrate', 'status'], env);
  nodeTool('tsx/dist/cli.mjs', ['prisma/seed.ts'], env);
  nodeTool('tsx/dist/cli.mjs', ['--test', 'tests/api.test.ts'], env);
  nodeTool('tsx/dist/cli.mjs', ['--test', 'tests/production.test.ts'], { ...env, NODE_ENV: 'production', FRONTEND_URL: 'https://store.example.test' });
  if (process.env.TEST_FRONTEND_PROXY === '1') nodeTool('tsx/dist/cli.mjs', ['--test', 'tests/proxy.test.ts'], env);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => {
  if (started) {
    try { run(executable('pg_ctl'), ['-D', data, '-m', 'fast', '-w', 'stop'], process.env, { stdio: 'inherit' }); }
    catch { console.error('Could not stop the temporary test cluster'); process.exitCode = 1; return; }
  }
  // Delete only the verified, generated temporary test directory.
  const target = path.resolve(temp);
  const parent = path.resolve(os.tmpdir()) + path.sep;
  if (target.startsWith(parent) && path.basename(target).startsWith('triger-postgres-test-')) fs.rmSync(target, { recursive: true, force: true });
});
