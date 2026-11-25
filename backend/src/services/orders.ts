import { Prisma } from '@prisma/client';
import { prisma, transaction } from '../db';
import { config } from '../config';
import { ApiError } from '../errors';
import { orderBody } from '../validation';
export async function createOrder(userId: string, body: unknown) {
  const { idempotencyKey } = orderBody.parse(body);
  return transaction(async tx => {
    const existing = await tx.order.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } }, include: { items: true } });
    if (existing) return existing;
    const cart = await tx.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
    if (!cart?.items.length) throw new ApiError(400, 'Cart is empty');
    const subtotal = cart.items.reduce((sum, item) => {
      if (!item.product.isActive || item.quantity > item.product.stock) throw new ApiError(409, 'A cart product is unavailable');
      return sum.plus(item.product.price.mul(item.quantity));
    }, new Prisma.Decimal(0));
    const shippingAmount = new Prisma.Decimal(config.SHIPPING_AMOUNT);
    const total = subtotal.plus(shippingAmount);
    if (total.greaterThan('9999999999.99')) throw new ApiError(400, 'Order exceeds maximum total');
    // Pre-payment draft only: no stock is reserved or decremented yet.
    // TODO payment integration: revalidate/reserve stock before starting a payment;
    // expire reservations on cancellation/timeout and finalize them after verified payment.
    const order = await tx.order.create({ data: {
      userId, idempotencyKey, subtotal, shippingAmount, total, currency: 'EUR',
      status: 'AWAITING_PAYMENT', paymentStatus: 'PENDING',
      items: { create: cart.items.map(item => ({ productId: item.productId, productName: item.product.name, unitPrice: item.product.price, quantity: item.quantity })) },
    }, include: { items: true } });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
    return order;
  });
}
export const listOrders = (userId: string) => prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 100 });
export async function readOrder(userId: string, id: string) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: { items: true } });
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
}
