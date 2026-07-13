import { prisma } from '../../config/prisma';

export class InventoryService {
  static async getStockLevels(warehouseId?: number, productId?: number, lowStockOnly = false, page = 1, limit = 20) {
    const where: any = { isActive: true };
    if (productId) where.id = productId;

    const products = await prisma.product.findMany({ where, include: { category: true }, orderBy: { name: 'asc' } });
    
    const warehouseWhere: any = { isActive: true };
    if (warehouseId) warehouseWhere.id = warehouseId;
    const warehouses = await prisma.warehouse.findMany({ where: warehouseWhere });

    const stockLevels: any[] = [];

    for (const product of products) {
      for (const warehouse of warehouses) {
        const result = await prisma.inventoryTransaction.aggregate({
          _sum: { quantity: true },
          where: { productId: product.id, warehouseId: warehouse.id }
        });
        const quantity = result._sum.quantity || 0;
        if (lowStockOnly && quantity > product.reorderLevel) continue;
        stockLevels.push({
          productId: product.id, productName: product.name, sku: product.sku,
          warehouseId: warehouse.id, warehouseName: warehouse.name, quantity,
          reorderLevel: product.reorderLevel, needsReorder: quantity <= product.reorderLevel
        });
      }
    }

    const total = stockLevels.length;
    const startIndex = (page - 1) * limit;
    const items = stockLevels.slice(startIndex, startIndex + limit);

    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  static async getProductStock(productId: number, warehouseId?: number) {
    const product = await prisma.product.findUnique({ where: { id: productId }, include: { category: true, supplier: true } });
    if (!product || !product.isActive) throw Object.assign(new Error('Product not found'), { statusCode: 404 });

    const warehouseWhere: any = { isActive: true };
    if (warehouseId) warehouseWhere.id = warehouseId;
    const warehouses = await prisma.warehouse.findMany({ where: warehouseWhere });

    const stockByWarehouse = [];
    let totalStock = 0;

    for (const warehouse of warehouses) {
      const result = await prisma.inventoryTransaction.aggregate({ _sum: { quantity: true }, where: { productId, warehouseId: warehouse.id } });
      const qty = result._sum.quantity || 0;
      totalStock += qty;
      stockByWarehouse.push({ warehouseId: warehouse.id, warehouseName: warehouse.name, quantity: qty });
    }

    return {
      product: { id: product.id, sku: product.sku, name: product.name, price: product.price, costPrice: product.costPrice, reorderLevel: product.reorderLevel, category: product.category, supplier: product.supplier },
      totalStock, needsReorder: totalStock <= product.reorderLevel, stockByWarehouse
    };
  }

  static async getProductHistory(productId: number, page = 1, limit = 20, type?: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 });

    const where: any = { productId };
    if (type) where.type = type;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { warehouse: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } } }),
      prisma.inventoryTransaction.count({ where })
    ]);

    return { product: { id: product.id, name: product.name, sku: product.sku }, transactions: items, total, page, pages: Math.ceil(total / limit) };
  }

  static async adjustStock(data: any, userId: number) {
    const { productId, warehouseId, type, quantity, notes } = data;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse || !warehouse.isActive) throw Object.assign(new Error('Warehouse not found'), { statusCode: 404 });

    let signedQuantity = quantity;
    if (type === 'DAMAGE') {
      const currentStock = await this.getCurrentStock(productId, warehouseId);
      if (currentStock < quantity) throw Object.assign(new Error('Insufficient stock for damage write-off'), { statusCode: 400 });
      signedQuantity = -quantity;
    }

    return prisma.inventoryTransaction.create({
      data: { productId, warehouseId, type, quantity: signedQuantity, referenceType: 'MANUAL', userId, notes: notes || 'Manual ' + type.toLowerCase() },
      include: { product: { select: { id: true, name: true, sku: true } }, warehouse: { select: { id: true, name: true } } }
    });
  }

  static async transferStock(data: any, userId: number) {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = data;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw Object.assign(new Error('Product not found'), { statusCode: 404 });

    const [fromWarehouse, toWarehouse] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: fromWarehouseId } }),
      prisma.warehouse.findUnique({ where: { id: toWarehouseId } })
    ]);

    if (!fromWarehouse || !fromWarehouse.isActive) throw Object.assign(new Error('Source warehouse not found'), { statusCode: 404 });
    if (!toWarehouse || !toWarehouse.isActive) throw Object.assign(new Error('Destination warehouse not found'), { statusCode: 404 });

    const currentStock = await this.getCurrentStock(productId, fromWarehouseId);
    if (currentStock < quantity) throw Object.assign(new Error('Insufficient stock in source warehouse'), { statusCode: 400 });

    return prisma.$transaction(async (tx) => {
      const transferOut = await tx.inventoryTransaction.create({
        data: { productId, warehouseId: fromWarehouseId, type: 'TRANSFER_OUT', quantity: -quantity, referenceType: 'TRANSFER', userId, notes: notes || 'Transfer to ' + toWarehouse.name }
      });
      const transferIn = await tx.inventoryTransaction.create({
        data: { productId, warehouseId: toWarehouseId, type: 'TRANSFER_IN', quantity: quantity, referenceType: 'TRANSFER', userId, notes: notes || 'Transfer from ' + fromWarehouse.name }
      });

      return {
        product: { id: product.id, name: product.name, sku: product.sku },
        from: { warehouseId: fromWarehouseId, warehouseName: fromWarehouse.name, quantity: -quantity },
        to: { warehouseId: toWarehouseId, warehouseName: toWarehouse.name, quantity },
        transferOut, transferIn
      };
    });
  }

  private static async getCurrentStock(productId: number, warehouseId: number): Promise<number> {
    const result = await prisma.inventoryTransaction.aggregate({ _sum: { quantity: true }, where: { productId, warehouseId } });
    return result._sum.quantity || 0;
  }
}