import { prisma } from '../../config/prisma';

export class SaleService {
  static async create(data: any, userId: number) {
    const productIds = data.items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id: number) => !foundIds.has(id));
      throw Object.assign(new Error('Products not found: ' + missing.join(', ')), { statusCode: 404 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of data.items) {
      const currentStock = await this.getCurrentStock(item.productId, data.warehouseId);
      if (currentStock < item.quantity) {
        const product = productMap.get(item.productId)!;
        throw Object.assign(
          new Error('Insufficient stock for "' + product.name + '". Available: ' + currentStock + ', Requested: ' + item.quantity),
          { statusCode: 400 }
        );
      }
    }

    const warehouse = await prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
    if (!warehouse || !warehouse.isActive) {
      throw Object.assign(new Error('Warehouse not found'), { statusCode: 404 });
    }

    const saleCount = await prisma.sale.count();
    const saleNumber = 'SALE-' + new Date().getFullYear() + '-' + String(saleCount + 1).padStart(4, '0');

    const itemsWithPrices = data.items.map((item: any) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.price);
      return { ...item, unitPrice, totalPrice: item.quantity * unitPrice };
    });
    const totalAmount = itemsWithPrices.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          saleNumber, userId, totalAmount, notes: data.notes,
          items: { create: itemsWithPrices.map((item: any) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice })) },
        },
        include: { items: { include: { product: true } }, user: { select: { id: true, name: true, email: true } } },
      });

      for (const item of data.items) {
        await tx.inventoryTransaction.create({
          data: { productId: item.productId, warehouseId: data.warehouseId, type: 'SALE', quantity: -item.quantity, referenceType: 'SALE', referenceId: sale.id, userId, notes: 'Sale ' + saleNumber },
        });
      }
      return sale;
    });
  }

  static async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.sale.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true } }, _count: { select: { items: true } } } }),
      prisma.sale.count(),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  static async findById(id: number) {
    const sale = await prisma.sale.findUnique({ where: { id }, include: { items: { include: { product: true } }, user: { select: { id: true, name: true, email: true } } } });
    if (!sale) throw Object.assign(new Error('Sale not found'), { statusCode: 404 });
    return sale;
  }

  private static async getCurrentStock(productId: number, warehouseId: number): Promise<number> {
    const result = await prisma.inventoryTransaction.aggregate({ _sum: { quantity: true }, where: { productId, warehouseId } });
    return result._sum.quantity || 0;
  }
}
