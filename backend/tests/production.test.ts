import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { config, cookieName } from '../src/config';
if (process.env.TEST_DATABASE_ISOLATED !== '1' || config.NODE_ENV !== 'production') throw new Error('Use isolated production-security test runner');
after(() => prisma.$disconnect());
test('production cookie flags, origin restrictions and safe errors', async () => {
  const result = await request(app).post('/api/auth/register').set('Origin', config.FRONTEND_URL).send({
    email: 'production-cookie@example.test', password: randomBytes(24).toString('hex'), firstName: 'Test', lastName: 'Cookie',
  }).expect(201);
  assert.equal(cookieName, '__Host-triger-session');
  const cookie = result.headers['set-cookie'][0];
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(cookie.includes(flag));
  assert.ok(!cookie.includes('Domain='));
  await request(app).get('/api/auth/me').set('Cookie', cookie.split(';')[0]).expect(200);
  await request(app).get('/api/products').set('Origin', 'https://untrusted.example').expect(403);
  const malformed = await request(app).post('/api/auth/login').set('Origin', config.FRONTEND_URL).set('Content-Type', 'application/json').send('{').expect(400);
  assert.deepEqual(Object.keys(malformed.body), ['error']);
  assert.ok(!JSON.stringify(malformed.body).includes('stack'));
});
