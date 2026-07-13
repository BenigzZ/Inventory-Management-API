import { prisma } from '../../config/prisma';
import { CreateProductInput, UpdateProductInput } from './products.validation';

export class ProductService {
  static async create(data: CreateProductInput) {
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing) {
      throw Object.assign(new Error('Product with this SKU already exists'), { statusCode: 409 });
    }

    return prisma.product.create({
      data,
      include: { category: true, supplier: true },
    });
  }

  static async findAll(page = 1, limit = 20, categoryId?: number, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };

    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { category: true, supplier: true },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  static async findById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, supplier: true },
    });
    if (!product || !product.isActive) {
      throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    }
    return product;
  }

  static async update(id: number, data: UpdateProductInput) {
    await this.findById(id);

    if (data.sku) {
      const existing = await prisma.product.findFirst({
        where: { sku: data.sku, NOT: { id } },
      });
      if (existing) {
        throw Object.assign(new Error('Product with this SKU already exists'), { statusCode: 409 });
      }
    }

    return prisma.product.update({
      where: { id },
      data,
      include: { category: true, supplier: true },
    });
  }

  static async delete(id: number) {
    await this.findById(id);
    // Soft delete
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}