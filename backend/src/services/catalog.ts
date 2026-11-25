import { prisma, transaction } from '../db';
import { ApiError } from '../errors';
import { categoryBody, productBody, productQuery } from '../validation';
export const catalog = {
  async products(query: unknown) {
    const { slug, categoryId, page, limit } = productQuery.parse(query);
    return prisma.product.findMany({ where: { isActive: true, slug, categoryId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit });
  },
  async product(id: string) {
    const product = await prisma.product.findFirst({ where: { id, isActive: true } });
    if (!product) throw new ApiError(404, 'Product not found');
    return product;
  },
  createProduct: (body: unknown) => prisma.product.create({ data: productBody.parse(body) }),
  updateProduct: (id: string, body: unknown) => prisma.product.update({ where: { id }, data: productBody.partial().parse(body) }),
  // Keep records used by carts/orders; inactive products cannot be ordered.
  deleteProduct: (id: string) => prisma.product.update({ where: { id }, data: { isActive: false } }),
  categories: () => prisma.category.findMany({ orderBy: { name: 'asc' }, take: 1000 }),
  async category(id: string) {
    const result = await prisma.category.findUnique({ where: { id } });
    if (!result) throw new ApiError(404, 'Category not found');
    return result;
  },
  createCategory: (body: unknown) => prisma.category.create({ data: categoryBody.parse(body) }),
  updateCategory: (id: string, body: unknown) => prisma.category.update({ where: { id }, data: categoryBody.partial().parse(body) }),
  deleteCategory: (id: string) => transaction(async tx => {
    if (await tx.product.count({ where: { categoryId: id } })) throw new ApiError(409, 'Category still contains products');
    return tx.category.delete({ where: { id } });
  }),
};
