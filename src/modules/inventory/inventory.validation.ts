import { z } from 'zod';

export const adjustStockSchema = z.object({
  productId: z.number().int().positive(),
  warehouseId: z.number().int().positive(),
  type: z.enum(['RETURN', 'DAMAGE', 'ADJUSTMENT']),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().max(1000).optional(),
});

export const transferStockSchema = z
  .object({
    productId: z.number().int().positive(),
    fromWarehouseId: z.number().int().positive(),
    toWarehouseId: z.number().int().positive(),
    quantity: z.number().int().positive('Quantity must be positive'),
    notes: z.string().max(1000).optional(),
  })
  .refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
    message: 'Source and destination warehouses must be different',
    path: ['toWarehouseId'],
  });