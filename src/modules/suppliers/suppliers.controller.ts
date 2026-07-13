import { Request, Response, NextFunction } from 'express';
import { SupplierService } from './suppliers.service';
export class SupplierController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await SupplierService.create(req.body); res.status(201).json(result); } catch (error) { next(error); } }
  static async findAll(req: Request, res: Response, next: NextFunction): Promise<void> { try { const page = parseInt(req.query.page as string) || 1; const limit = parseInt(req.query.limit as string) || 20; const result = await SupplierService.findAll(page, limit); res.status(200).json(result); } catch (error) { next(error); } }
  static async findById(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await SupplierService.findById(parseInt(req.params.id)); res.status(200).json(result); } catch (error) { next(error); } }
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await SupplierService.update(parseInt(req.params.id), req.body); res.status(200).json(result); } catch (error) { next(error); } }
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> { try { await SupplierService.delete(parseInt(req.params.id)); res.status(204).send(); } catch (error) { next(error); } }
}
