import { z } from 'zod';
export const createWarehouseSchema = z.object({ name: z.string().min(1).max(200), address: z.string().max(500).optional() });
export const updateWarehouseSchema = z.object({ name: z.string().min(1).max(200).optional(), address: z.string().max(500).optional().nullable(), isActive: z.boolean().optional() });
