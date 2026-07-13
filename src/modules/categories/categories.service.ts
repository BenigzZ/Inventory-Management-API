import { prisma } from '../../config/prisma';
export class CategoryService {
  static async create(data: any) { return prisma.category.create({ data }); }
  static async findAll(page = 1, limit = 20) { const skip = (page - 1) * limit; const [items, total] = await Promise.all([prisma.category.findMany({ skip, take: limit, orderBy: { name: 'asc' } }), prisma.category.count()]); return { items, total, page, pages: Math.ceil(total / limit) }; }
  static async findById(id: number) { const category = await prisma.category.findUnique({ where: { id }, include: { products: { where: { isActive: true } } } }); if (!category) throw Object.assign(new Error('Category not found'), { statusCode: 404 }); return category; }
  static async update(id: number, data: any) { await this.findById(id); return prisma.category.update({ where: { id }, data }); }
  static async delete(id: number) { const category = await prisma.category.findUnique({ where: { id }, include: { products: true } }); if (!category) throw Object.assign(new Error('Category not found'), { statusCode: 404 }); if (category.products.length > 0) throw Object.assign(new Error('Cannot delete category with associated products'), { statusCode: 400 }); return prisma.category.delete({ where: { id } }); }
}
