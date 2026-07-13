import express from 'express';
import { errorHandler } from './middleware/errorHandler';

import { router as authRoutes } from './modules/auth/auth.routes';
import { router as categoryRoutes } from './modules/categories/categories.routes';
import { router as productRoutes } from './modules/products/products.routes';
import { router as supplierRoutes } from './modules/suppliers/suppliers.routes';
import { router as warehouseRoutes } from './modules/warehouses/warehouses.routes';
import { router as purchaseOrderRoutes } from './modules/purchase-orders/purchase-orders.routes';
import { router as saleRoutes } from './modules/sales/sales.routes';
import { router as inventoryRoutes } from './modules/inventory/inventory.routes';

const app = express();

// --- DIAGNOSTIC: Find the exact broken file ---
const routes = { authRoutes, categoryRoutes, productRoutes, supplierRoutes, warehouseRoutes, purchaseOrderRoutes, saleRoutes, inventoryRoutes };
for (const [name, route] of Object.entries(routes)) {
  if (!route) {
    console.error(`\n❌ BROKEN IMPORT: "${name}" is undefined! The corresponding .routes.ts file is missing "export { router }" or has a syntax error.\n`);
  }
}
// ----------------------------------------------

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/inventory', inventoryRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

export { app };