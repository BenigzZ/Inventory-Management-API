import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create warehouses
  const warehouseMain = await prisma.warehouse.upsert({
    where: { name: 'Main Warehouse' },
    update: {},
    create: { name: 'Main Warehouse', address: '123 Warehouse Blvd' },
  });

  const warehouseSecondary = await prisma.warehouse.upsert({
    where: { name: 'Secondary Warehouse' },
    update: {},
    create: { name: 'Secondary Warehouse', address: '456 Storage Ave' },
  });

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@inventory.com' },
    update: {},
    create: { email: 'admin@inventory.com', password: adminPassword, name: 'Admin User', role: Role.ADMIN },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@inventory.com' },
    update: {},
    create: { email: 'staff@inventory.com', password: staffPassword, name: 'Staff User', role: Role.STAFF },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@inventory.com' },
    update: {},
    create: { email: 'viewer@inventory.com', password: viewerPassword, name: 'Viewer User', role: Role.VIEWER },
  });

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics', description: 'Electronic devices and accessories' },
  });

  const office = await prisma.category.upsert({
    where: { name: 'Office Supplies' },
    update: {},
    create: { name: 'Office Supplies', description: 'General office supplies' },
  });

  // Create suppliers
  const techSupplier = await prisma.supplier.upsert({
    where: { email: 'orders@techsupply.com' },
    update: {},
    create: { name: 'Tech Supply Co.', email: 'orders@techsupply.com', phone: '555-0101', address: '789 Tech Lane' },
  });

  const officeSupplier = await prisma.supplier.upsert({
    where: { email: 'sales@officeworld.com' },
    update: {},
    create: { name: 'Office World', email: 'sales@officeworld.com', phone: '555-0202', address: '321 Office Park' },
  });

  // Create products
  const laptop = await prisma.product.create({
    data: {
      sku: 'ELEC-001',
      name: 'Laptop Pro 15"',
      description: '15-inch professional laptop',
      price: 1299.99,
      costPrice: 899.99,
      reorderLevel: 10,
      categoryId: electronics.id,
      supplierId: techSupplier.id,
    },
  });

  const mouse = await prisma.product.create({
    data: {
      sku: 'ELEC-002',
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse',
      price: 29.99,
      costPrice: 12.50,
      reorderLevel: 50,
      categoryId: electronics.id,
      supplierId: techSupplier.id,
    },
  });

  const paper = await prisma.product.create({
    data: {
      sku: 'OFF-001',
      name: 'A4 Paper Ream',
      description: '500 sheets of A4 paper',
      price: 8.99,
      costPrice: 4.50,
      reorderLevel: 100,
      categoryId: office.id,
      supplierId: officeSupplier.id,
    },
  });

  // Create a purchase order to add initial stock
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2024-001',
      supplierId: techSupplier.id,
      userId: admin.id,
      status: 'PENDING',
      totalAmount: 91249.75,
      items: {
        create: [
          { productId: laptop.id, quantity: 50, unitCost: 899.99, totalCost: 44999.50 },
          { productId: mouse.id, quantity: 200, unitCost: 12.50, totalCost: 2500.00 },
        ],
      },
    },
  });

  // Receive the PO — create inventory transactions
  await prisma.inventoryTransaction.createMany({
    data: [
      {
        productId: laptop.id,
        warehouseId: warehouseMain.id,
        type: 'PURCHASE',
        quantity: 50,
        referenceType: 'PURCHASE_ORDER',
        referenceId: po.id,
        userId: admin.id,
        notes: 'Initial stock',
      },
      {
        productId: mouse.id,
        warehouseId: warehouseMain.id,
        type: 'PURCHASE',
        quantity: 200,
        referenceType: 'PURCHASE_ORDER',
        referenceId: po.id,
        userId: admin.id,
        notes: 'Initial stock',
      },
    ],
  });

  await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: { status: 'RECEIVED' },
  });

  // Another PO for office supplies
  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2024-002',
      supplierId: officeSupplier.id,
      userId: staff.id,
      status: 'PENDING',
      totalAmount: 900.00,
      items: {
        create: [
          { productId: paper.id, quantity: 200, unitCost: 4.50, totalCost: 900.00 },
        ],
      },
    },
  });

  await prisma.inventoryTransaction.create({
    data: {
      productId: paper.id,
      warehouseId: warehouseMain.id,
      type: 'PURCHASE',
      quantity: 200,
      referenceType: 'PURCHASE_ORDER',
      referenceId: po2.id,
      userId: staff.id,
      notes: 'Initial stock',
    },
  });

  await prisma.purchaseOrder.update({
    where: { id: po2.id },
    data: { status: 'RECEIVED' },
  });

  console.log('✅ Seed data created successfully');
  console.log({ warehouseMain, warehouseSecondary, admin, staff });
  console.log({ laptop: laptop.id, mouse: mouse.id, paper: paper.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });