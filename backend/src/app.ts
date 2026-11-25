import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { config, cookieName, cookieOptions, origins } from './config';
import { prisma } from './db';
import { ApiError, errorHandler } from './errors';
import { requireAuth, requireAdmin, createSession, revokeSession } from './auth';
import { register, login } from './services/authentication';
import { catalog } from './services/catalog';
import { readCart, addItem, changeItem } from './services/cart';
import { createOrder, listOrders, readOrder } from './services/orders';
import { checkoutUnavailable, webhookUnavailable } from './services/payment';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.TRUST_PROXY_HOPS);
app.use(helmet());
app.use(cors({ credentials: true, origin(origin, done) { done(origin && !origins.includes(origin) ? new ApiError(403, 'Origin not allowed') : null, true); } }));
app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
// Webhooks are outside browser CSRF checks; they must use provider signatures instead.
app.post('/api/webhooks/payment', express.raw({ type: 'application/json', limit: '100kb' }), (_req, _res) => webhookUnavailable());
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use((req, _res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && (!req.headers.origin || !origins.includes(req.headers.origin))) throw new ApiError(403, 'Trusted Origin header required');
  next();
});
// Memory limits are supplemental per-instance protection. Configure a distributed
// firewall/rate limit at the hosting edge for production and serverless scaling.
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, skip: req => req.method === 'GET', standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many authentication requests' } }));
app.get('/api/health', async (_req, res) => { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ok' }); });
app.post('/api/auth/register', async (req, res) => {
  const user = await register(req.body);
  await revokeSession(req);
  await createSession(user.id, res);
  res.status(201).json(user);
});
app.post('/api/auth/login', async (req, res) => {
  const user = await login(req.body);
  await revokeSession(req);
  await createSession(user.id, res);
  res.json(user);
});
app.post('/api/auth/logout', async (req, res) => { await revokeSession(req); res.clearCookie(cookieName, cookieOptions); res.status(204).end(); });
app.get('/api/auth/me', requireAuth, (req, res) => { res.json(req.user); });
app.get('/api/products', async (req, res) => { res.json(await catalog.products(req.query)); });
app.get('/api/products/:id', async (req, res) => { res.json(await catalog.product(String(req.params.id))); });
app.post('/api/products', requireAuth, requireAdmin, async (req, res) => { res.status(201).json(await catalog.createProduct(req.body)); });
app.patch('/api/products/:id', requireAuth, requireAdmin, async (req, res) => { res.json(await catalog.updateProduct(String(req.params.id), req.body)); });
app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res) => { await catalog.deleteProduct(String(req.params.id)); res.status(204).end(); });
app.get('/api/categories', async (_req, res) => { res.json(await catalog.categories()); });
app.get('/api/categories/:id', async (req, res) => { res.json(await catalog.category(String(req.params.id))); });
app.post('/api/categories', requireAuth, requireAdmin, async (req, res) => { res.status(201).json(await catalog.createCategory(req.body)); });
app.patch('/api/categories/:id', requireAuth, requireAdmin, async (req, res) => { res.json(await catalog.updateCategory(String(req.params.id), req.body)); });
app.delete('/api/categories/:id', requireAuth, requireAdmin, async (req, res) => { await catalog.deleteCategory(String(req.params.id)); res.status(204).end(); });
app.get('/api/cart', requireAuth, async (req, res) => { res.json(await readCart(req.user!.id)); });
app.post('/api/cart/items', requireAuth, async (req, res) => { res.status(201).json(await addItem(req.user!.id, req.body)); });
app.patch('/api/cart/items/:id', requireAuth, async (req, res) => { res.json(await changeItem(req.user!.id, String(req.params.id), req.body)); });
app.delete('/api/cart/items/:id', requireAuth, async (req, res) => { await changeItem(req.user!.id, String(req.params.id)); res.status(204).end(); });
app.post('/api/orders', requireAuth, async (req, res) => { res.status(201).json(await createOrder(req.user!.id, req.body)); });
app.get('/api/orders', requireAuth, async (req, res) => { res.json(await listOrders(req.user!.id)); });
app.get('/api/orders/:id', requireAuth, async (req, res) => { res.json(await readOrder(req.user!.id, String(req.params.id))); });
app.post('/api/checkout', requireAuth, (_req, _res) => checkoutUnavailable());
app.use((_req, _res) => { throw new ApiError(404, 'Endpoint not found'); });
app.use(errorHandler);
export default app;
