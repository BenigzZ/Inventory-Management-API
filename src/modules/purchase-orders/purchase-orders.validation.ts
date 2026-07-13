import { z } from 'zod';
export const createPurchaseOrderSchema = z.object({ supplierId: z.number().int().positive(), warehouseId: z.number().int().positive(), notes: z.string().max(1000).optional(), items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive(), unitCost: z.number().positive() })).min(1, 'At least one item is required') });
export const receivePurchaseOrderSchema = z.object({ warehouseId: z.number().int().positive().optional(), notes: z.string().max(1000).optional() });
