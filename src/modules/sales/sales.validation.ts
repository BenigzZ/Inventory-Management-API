import { z } from 'zod';
export const createSaleSchema = z.object({
  warehouseId: z.number().int().positive(),
  notes: z.string().max(1000).optional(),
  items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive('Quantity must be positive') })).min(1, 'At least one item is required'),
});
