import { Request, Response, NextFunction } from 'express';
import { SaleService } from './sales.service';

export class SaleController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { const result = await SaleService.create(req.body, req.user!.userId); res.status(201).json(result); } catch (error) { next(error); }
  }
  static async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { const page = parseInt(req.query.page as string) || 1; const limit = parseInt(req.query.limit as string) || 20; const result = await SaleService.findAll(page, limit); res.status(200).json(result); } catch (error) { next(error); }
  }
  static async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { const result = await SaleService.findById(parseInt(req.params.id)); res.status(200).json(result); } catch (error) { next(error); }
  }
}
