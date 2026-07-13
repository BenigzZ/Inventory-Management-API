import { prisma } from '../../config/prisma';
export class WarehouseService {
  static async create(data: any) { return prisma.warehouse.create({ data }); }
  static async findAll() { return prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }); }
  static async findById(id: number) { const warehouse = await prisma.warehouse.findUnique({ where: { id } }); if (!warehouse || !warehouse.isActive) throw Object.assign(new Error('Warehouse not found'), { statusCode: 404 }); return warehouse; }
  static async update(id: number, data: any) { await this.findById(id); return prisma.warehouse.update({ where: { id }, data }); }
  static async delete(id: number) { await this.findById(id); return prisma.warehouse.update({ where: { id }, data: { isActive: false } }); }
}
