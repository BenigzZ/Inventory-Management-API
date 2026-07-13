import { prisma } from '../../config/prisma';
export class PurchaseOrderService {
  static async create(data: any, userId: number) {
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier) throw Object.assign(new Error('Supplier not found'), { statusCode: 404 });
    for (const item of data.items) { const product = await prisma.product.findUnique({ where: { id: item.productId } }); if (!product) throw Object.assign(new Error('Product ' + item.productId + ' not found'), { statusCode: 404 }); }
    const poCount = await prisma.purchaseOrder.count();
    const poNumber = 'PO-' + new Date().getFullYear() + '-' + String(poCount + 1).padStart(4, '0');
    const totalAmount = data.items.reduce((sum: number, item: any) => sum + item.quantity * item.unitCost, 0);
    return prisma.purchaseOrder.create({ data: { poNumber, supplierId: data.supplierId, userId, status: 'PENDING', totalAmount, notes: data.notes, items: { create: data.items.map((item: any) => ({ productId: item.productId, quantity: item.quantity, unitCost: item.unitCost, totalCost: item.quantity * item.unitCost })) } }, include: { items: { include: { product: true } }, supplier: true } });
  }
  static async findAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit; const where: any = {}; if (status) where.status = status;
    const [items, total] = await Promise.all([prisma.purchaseOrder.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { supplier: { select: { id: true, name: true } }, user: { select: { id: true, name: true } }, _count: { select: { items: true } } } }), prisma.purchaseOrder.count({ where })]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }
  static async findById(id: number) { const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: { include: { product: true } }, supplier: true, user: { select: { id: true, name: true, email: true } } } }); if (!po) throw Object.assign(new Error('Purchase order not found'), { statusCode: 404 }); return po; }
  static async receive(id: number, data: any, userId: number) {
    const po = await this.findById(id);
    if (po.status !== 'PENDING') throw Object.assign(new Error('Purchase order is ' + po.status + ', cannot receive'), { statusCode: 400 });
    const warehouseId = data.warehouseId || 1;
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } }); if (!warehouse || !warehouse.isActive) throw Object.assign(new Error('Warehouse not found'), { statusCode: 404 });
    return prisma.$transaction(async (tx) => {
      const updatedPO = await tx.purchaseOrder.update({ where: { id }, data: { status: 'RECEIVED' } });
      const inventoryTransactions = [];
      for (const item of po.items) { const transaction = await tx.inventoryTransaction.create({ data: { productId: item.productId, warehouseId, type: 'PURCHASE', quantity: item.quantity, referenceType: 'PURCHASE_ORDER', referenceId: po.id, userId, notes: data.notes || 'Received PO ' + po.poNumber } }); inventoryTransactions.push(transaction); }
      return { purchaseOrder: updatedPO, inventoryTransactions };
    });
  }
  static async cancel(id: number) { const po = await this.findById(id); if (po.status !== 'PENDING') throw Object.assign(new Error('Only pending purchase orders can be cancelled'), { statusCode: 400 }); return prisma.purchaseOrder.update({ where: { id }, data: { status: 'CANCELLED' } }); }
}
