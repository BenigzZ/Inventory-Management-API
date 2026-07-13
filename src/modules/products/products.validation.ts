import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Price must be positive'),
  costPrice: z.number().positive('Cost price must be positive'),
  reorderLevel: z.number().int().min(0).default(0),
  categoryId: z.number().int().positive(),
  supplierId: z.number().int().positive().optional(),
});

export const updateProductSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  reorderLevel: z.number().int().min(0).optional(),
  categoryId: z.number().int().positive().optional(),
  supplierId: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;