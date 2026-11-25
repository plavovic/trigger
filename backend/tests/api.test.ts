import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import app from '../src/app';
import { prisma } from '../src/db';
import { cookieName } from '../src/config';
if (process.env.TEST_DATABASE_ISOLATED !== '1' || !new URL(process.env.DATABASE_URL!).pathname.startsWith('/triger_test_')) throw new Error('Run npm run test:isolated; never run this suite against a shared database');
after(() => prisma.$disconnect());
const origin = process.env.FRONTEND_URL!;
const password = randomBytes(24).toString('hex');
test('real PostgreSQL API lifecycle and security', async t => {
  const customer = request.agent(app);
  const stranger = request.agent(app);
  const admin = request.agent(app);
  let userId = '';
  let productId = '';
  let itemId = '';
  let orderId = '';
  let initialCookie = '';
  const post = (agent: ReturnType<typeof request.agent>, route: string, data: object) => agent.post(route).set('Origin', origin).send(data);
  await t.test('health and security headers', async () => {
    const result = await request(app).get('/api/health').expect(200);
    assert.equal(result.body.status, 'ok'); assert.ok(result.headers['x-content-type-options']);
    assert.equal(result.headers['cache-control'], 'no-store');
  });
  await t.test('invalid registration, role injection and CSRF rejected', async () => {
    await post(customer, '/api/auth/register', { email: 'bad', password: 'short' }).expect(400);
    await post(customer, '/api/auth/register', { email: 'user@example.test', password, firstName: 'A', lastName: 'B', role: 'ADMIN' }).expect(400);
    await request(app).post('/api/auth/register').send({}).expect(403);
    await request(app).post('/api/auth/login').set('Origin', 'https://evil.example').send({}).expect(403);
  });
  await t.test('register hashes password, issues HttpOnly cookie and never returns hash', async () => {
    const result = await post(customer, '/api/auth/register', { email: 'customer@example.test', password, firstName: 'Ada', lastName: 'Customer' }).expect(201);
    userId = result.body.id; assert.equal(result.body.role, 'CUSTOMER'); assert.equal(result.body.passwordHash, undefined);
    initialCookie = result.headers['set-cookie'][0];
    assert.match(initialCookie, /HttpOnly/); assert.match(initialCookie, /SameSite=Lax/); assert.match(initialCookie, /Expires=/);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    assert.notEqual(user.passwordHash, password); assert.ok(await bcrypt.compare(password, user.passwordHash));
    const raw = initialCookie.split(';')[0].split('=')[1];
    const session = await prisma.session.findFirstOrThrow({ where: { userId } });
    assert.notEqual(session.tokenHash, raw);
    await post(customer, '/api/auth/register', { email: 'customer@example.test', password, firstName: 'A', lastName: 'B' }).expect(409);
  });
  await t.test('authenticated me, invalid login, successful login and session rotation', async () => {
    const me = await customer.get('/api/auth/me').expect(200); assert.equal(me.body.id, userId); assert.equal(me.body.passwordHash, undefined);
    await post(customer, '/api/auth/login', { email: 'customer@example.test', password: 'wrong' }).expect(401);
    await post(customer, '/api/auth/login', { email: 'missing@example.test', password }).expect(401);
    await post(customer, '/api/auth/login', { email: 'CUSTOMER@example.test', password }).expect(200);
    await request(app).get('/api/auth/me').set('Cookie', initialCookie.split(';')[0]).expect(401);
  });
  await t.test('expired sessions rejected', async () => {
    await post(stranger, '/api/auth/register', { email: 'stranger@example.test', password, firstName: 'Other', lastName: 'User' }).expect(201);
    const other = await prisma.user.findUniqueOrThrow({ where: { email: 'stranger@example.test' } });
    await prisma.session.updateMany({ where: { userId: other.id }, data: { expiresAt: new Date(0) } });
    await stranger.get('/api/auth/me').expect(401);
    await post(stranger, '/api/auth/login', { email: other.email, password }).expect(200);
  });
  await t.test('public catalog and slug lookup; anonymous and customer admin rejected', async () => {
    const result = await request(app).get('/api/products').expect(200); assert.equal(result.body.length, 6);
    productId = result.body[0].id;
    await request(app).get(`/api/products/${productId}`).expect(200);
    const bySlug = await request(app).get('/api/products?slug=workhorse').expect(200); assert.equal(bySlug.body.length, 1);
    await request(app).get('/api/products?limit=999').expect(400);
    await request(app).get('/api/products/does-not-exist').expect(404);
    await request(app).get('/api/categories').expect(200);
    await post(request.agent(app), '/api/products', {}).expect(401);
    await post(customer, '/api/products', {}).expect(403);
    await post(customer, '/api/categories', {}).expect(403);
  });
  await t.test('safe admin promotion and category/product CRUD', async () => {
    const registered = await post(admin, '/api/auth/register', { email: 'admin@example.test', password, firstName: 'Store', lastName: 'Admin' }).expect(201);
    assert.equal(registered.body.role, 'CUSTOMER');
    execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'scripts/promote-admin.ts', 'admin@example.test'], { cwd: path.resolve(__dirname, '..'), env: process.env, stdio: 'pipe' });
    await admin.get('/api/auth/me').expect(401);
    await post(admin, '/api/auth/login', { email: 'admin@example.test', password }).expect(200);
    const category = await post(admin, '/api/categories', { name: 'Test category', slug: 'test-category' }).expect(201);
    await admin.patch(`/api/categories/${category.body.id}`).set('Origin', origin).send({ name: 'Updated' }).expect(200);
    await request(app).get(`/api/categories/${category.body.id}`).expect(200);
    const product = await post(admin, '/api/products', { name: 'Test product', slug: 'test-product', description: 'Test', price: '0.10', stock: 5, categoryId: category.body.id, imageUrl: '/product01.png' }).expect(201);
    await admin.patch(`/api/products/${product.body.id}`).set('Origin', origin).send({ price: 0.1 }).expect(400);
    await admin.delete(`/api/categories/${category.body.id}`).set('Origin', origin).expect(409);
    await admin.delete(`/api/products/${product.body.id}`).set('Origin', origin).expect(204);
    await request(app).get(`/api/products/${product.body.id}`).expect(404);
    await post(customer, '/api/cart/items', { productId: product.body.id, quantity: 1 }).expect(404);
    await prisma.product.delete({ where: { id: product.body.id } });
    await admin.delete(`/api/categories/${category.body.id}`).set('Origin', origin).expect(204);
  });
  await t.test('cart created, quantities validated, stock enforced, duplicates consolidated', async () => {
    const cart = await customer.get('/api/cart').expect(200); assert.equal(cart.body.items.length, 0);
    await post(customer, '/api/cart/items', { productId, quantity: 0 }).expect(400);
    await post(customer, '/api/cart/items', { productId, quantity: 1.5 }).expect(400);
    await post(customer, '/api/cart/items', { productId, quantity: 1, price: '0.01' }).expect(400);
    await post(customer, '/api/cart/items', { productId: 'missing', quantity: 1 }).expect(404);
    await post(customer, '/api/cart/items', { productId, quantity: 2 }).expect(201);
    await post(customer, '/api/cart/items', { productId, quantity: 1 }).expect(201);
    const current = await customer.get('/api/cart').expect(200); assert.equal(current.body.items.length, 1); assert.equal(current.body.items[0].quantity, 3); assert.equal(current.body.subtotal, '60.00');
    itemId = current.body.items[0].id;
    await prisma.product.update({ where: { id: productId }, data: { stock: 3 } });
    await post(customer, '/api/cart/items', { productId, quantity: 1 }).expect(409);
    await customer.patch(`/api/cart/items/${itemId}`).set('Origin', origin).send({ quantity: 4 }).expect(409);
  });
  await t.test('cart ownership and removal enforced', async () => {
    await stranger.delete(`/api/cart/items/${itemId}`).set('Origin', origin).expect(404);
    await stranger.patch(`/api/cart/items/${itemId}`).set('Origin', origin).send({ quantity: 1 }).expect(404);
    await customer.patch(`/api/cart/items/${itemId}`).set('Origin', origin).send({ quantity: 2 }).expect(200);
    await customer.delete(`/api/cart/items/${itemId}`).set('Origin', origin).expect(204);
    const cart = await customer.get('/api/cart').expect(200); assert.equal(cart.body.items.length, 0);
  });
  await t.test('server exact totals, historical snapshots, PENDING and idempotency', async () => {
    await prisma.product.update({ where: { id: productId }, data: { price: '0.10', stock: 100 } });
    await post(customer, '/api/cart/items', { productId, quantity: 3 }).expect(201);
    const key = randomUUID();
    await post(customer, '/api/orders', { idempotencyKey: key, total: '0.01', paymentStatus: 'PAID' }).expect(400);
    const result = await post(customer, '/api/orders', { idempotencyKey: key }).expect(201);
    orderId = result.body.id;
    assert.equal(result.body.subtotal, '0.3'); assert.equal(result.body.shippingAmount, '4.9'); assert.equal(result.body.total, '5.2');
    assert.equal(result.body.currency, 'EUR'); assert.equal(result.body.paymentStatus, 'PENDING'); assert.equal(result.body.status, 'AWAITING_PAYMENT');
    assert.equal(result.body.paymentProvider, null); assert.equal(result.body.paymentReference, null);
    const originalName = result.body.items[0].productName;
    await prisma.product.update({ where: { id: productId }, data: { name: 'Changed product', price: '99.99' } });
    const history = await customer.get(`/api/orders/${orderId}`).expect(200);
    assert.equal(history.body.items[0].productName, originalName); assert.equal(history.body.items[0].unitPrice, '0.1');
    const duplicate = await post(customer, '/api/orders', { idempotencyKey: key }).expect(201); assert.equal(duplicate.body.id, orderId);
    assert.equal(await prisma.order.count({ where: { userId } }), 1);
    const cart = await customer.get('/api/cart').expect(200); assert.equal(cart.body.items.length, 0);
    await post(customer, '/api/orders', { idempotencyKey: randomUUID() }).expect(400);
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } }); assert.equal(product.stock, 100);
  });
  await t.test('order ownership, payment stubs and success URL cannot pay', async () => {
    await stranger.get(`/api/orders/${orderId}`).expect(404);
    await customer.get('/api/orders').expect(200);
    await post(customer, '/api/checkout', { orderId }).expect(501);
    await request(app).post('/api/webhooks/payment').send({ orderId, paymentStatus: 'PAID' }).expect(501);
    await customer.get(`/api/success?orderId=${orderId}`).expect(404);
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).paymentStatus, 'PENDING');
  });
  await t.test('concurrent adds preserve unique cart item and quantity', async () => {
    const results = await Promise.all([post(customer, '/api/cart/items', { productId, quantity: 1 }), post(customer, '/api/cart/items', { productId, quantity: 1 })]);
    assert.deepEqual(results.map(result => result.status), [201, 201]);
    const cart = await customer.get('/api/cart').expect(200); assert.equal(cart.body.items.length, 1); assert.equal(cart.body.items[0].quantity, 2);
  });
  await t.test('JSON limits and malformed JSON', async () => {
    await request(app).post('/api/auth/login').set('Origin', origin).send({ payload: 'x'.repeat(40000) }).expect(413);
    await request(app).post('/api/auth/login').set('Origin', origin).set('Content-Type', 'application/json').send('{').expect(400);
  });
  await t.test('logout invalidates session and me becomes unauthorized', async () => {
    const sessions = await prisma.session.count({ where: { userId } }); assert.equal(sessions, 1);
    await customer.post('/api/auth/logout').set('Origin', origin).expect(204);
    await customer.get('/api/auth/me').expect(401);
    assert.equal(await prisma.session.count({ where: { userId } }), 0);
    assert.ok(cookieName.length > 0);
  });
});
