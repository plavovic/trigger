import { z } from 'zod';
const text = z.string().trim().min(1).max(200);
export const email = z.string().trim().toLowerCase().email().max(254);
export const password = z.string().min(12).max(72).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password exceeds bcrypt byte limit');
export const registerBody = z.object({ email, password, firstName: text, lastName: text }).strict();
export const loginBody = z.object({ email, password: z.string().min(1).max(72) }).strict();
export const categoryBody = z.object({ name: text, slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(150) }).strict();
export const productBody = z.object({
  name: text, slug: categoryBody.shape.slug, description: z.string().trim().min(1).max(10000),
  price: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/), stock: z.number().int().min(0).max(1000000),
  imageUrl: z.string().max(2000).refine(value => /^\/(?!\/)/.test(value) || /^https:\/\//.test(value)),
  categoryId: text, isActive: z.boolean().default(true),
}).strict();
export const quantity = z.number().int().min(1).max(99);
export const addItemBody = z.object({ productId: text, quantity }).strict();
export const changeItemBody = z.object({ quantity }).strict();
export const orderBody = z.object({ idempotencyKey: z.string().uuid() }).strict();
export const productQuery = z.object({ slug: z.string().max(150).optional(), categoryId: text.optional(), page: z.coerce.number().int().min(1).max(10000).default(1), limit: z.coerce.number().int().min(1).max(100).default(50) }).strict();
