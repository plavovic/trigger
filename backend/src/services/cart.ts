import { Prisma } from '@prisma/client';
import { prisma, transaction } from '../db';
import { ApiError } from '../errors';
import { addItemBody, changeItemBody } from '../validation';
export async function readCart(userId: string) {
  const cart = await prisma.cart.upsert({ where: { userId }, create: { userId }, update: {}, include: { items: { include: { product: true }, orderBy: { createdAt: 'asc' } } } });
  const subtotal = cart.items.reduce((sum, item) => sum.plus(item.product.price.mul(item.quantity)), new Prisma.Decimal(0));
  return { ...cart, subtotal: subtotal.toFixed(2), currency: 'EUR' };
}
export async function addItem(userId: string, body: unknown) {
  const data = addItemBody.parse(body);
  return transaction(async tx => {
    const product = await tx.product.findUnique({ where: { id: data.productId } });
    if (!product?.isActive) throw new ApiError(404, 'Product unavailable');
    const cart = await tx.cart.upsert({ where: { userId }, create: { userId }, update: { updatedAt: new Date() } });
    const where = { cartId_productId: { cartId: cart.id, productId: product.id } };
    const existing = await tx.cartItem.findUnique({ where });
    const quantity = (existing?.quantity ?? 0) + data.quantity;
    if (quantity > 99 || quantity > product.stock) throw new ApiError(409, 'Requested quantity unavailable');
    return tx.cartItem.upsert({ where, create: { cartId: cart.id, productId: product.id, quantity }, update: { quantity } });
  });
}
export async function changeItem(userId: string, id: string, body?: unknown) {
  const data = body === undefined ? undefined : changeItemBody.parse(body);
  return transaction(async tx => {
    const item = await tx.cartItem.findFirst({ where: { id, cart: { userId } }, include: { product: true } });
    if (!item) throw new ApiError(404, 'Cart item not found');
    await tx.cart.update({ where: { id: item.cartId }, data: { updatedAt: new Date() } });
    if (!data) return tx.cartItem.delete({ where: { id } });
    if (!item.product.isActive || data.quantity > item.product.stock) throw new ApiError(409, 'Requested quantity unavailable');
    return tx.cartItem.update({ where: { id }, data });
  });
}
