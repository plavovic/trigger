import 'dotenv/config';
import { z } from 'zod';

const origin = z.string().url().refine(value => new URL(value).origin === value, 'Use an origin without a trailing slash or path');
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url().regex(/^postgres(ql)?:\/\//),
  DIRECT_URL: z.string().url().regex(/^postgres(ql)?:\/\//),
  FRONTEND_URL: origin,
  ADDITIONAL_FRONTEND_ORIGINS: z.string().default(''),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  SESSION_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  SHIPPING_AMOUNT: z.string().regex(/^\d{1,6}(\.\d{1,2})?$/).default('0.00'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) throw new Error(`Invalid environment variables: ${parsed.error.issues.map(issue => issue.path.join('.')).join(', ')}`);
export const config = parsed.data;
export const origins = [config.FRONTEND_URL, ...config.ADDITIONAL_FRONTEND_ORIGINS.split(',').filter(Boolean).map(value => origin.parse(value.trim()))];
if (config.NODE_ENV === 'production' && origins.some(value => !value.startsWith('https://'))) throw new Error('Production frontend origins must use HTTPS');
export const cookieName = config.NODE_ENV === 'production' ? '__Host-triger-session' : 'triger-session';
export const cookieOptions = { httpOnly: true, secure: config.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
