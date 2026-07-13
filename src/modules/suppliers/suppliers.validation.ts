import { z } from 'zod';
export const createSupplierSchema = z.object({ name: z.string().min(1).max(200), email: z.string().email('Invalid email format'), phone: z.string().max(30).optional(), address: z.string().max(500).optional() });
export const updateSupplierSchema = z.object({ name: z.string().min(1).max(200).optional(), email: z.string().email('Invalid email format').optional(), phone: z.string().max(30).optional().nullable(), address: z.string().max(500).optional().nullable() });
