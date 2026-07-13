import { Request, Response, NextFunction } from 'express';
import { WarehouseService } from './warehouses.service';
export class WarehouseController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await WarehouseService.create(req.body); res.status(201).json(result); } catch (error) { next(error); } }
  static async findAll(_req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await WarehouseService.findAll(); res.status(200).json(result); } catch (error) { next(error); } }
  static async findById(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await WarehouseService.findById(parseInt(req.params.id)); res.status(200).json(result); } catch (error) { next(error); } }
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await WarehouseService.update(parseInt(req.params.id), req.body); res.status(200).json(result); } catch (error) { next(error); } }
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> { try { await WarehouseService.delete(parseInt(req.params.id)); res.status(204).send(); } catch (error) { next(error); } }
}
