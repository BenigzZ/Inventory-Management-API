import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';

export class InventoryController {
  static async getStockLevels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId as string) : undefined;
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const lowStockOnly = req.query.lowStock === 'true';
      const result = await InventoryService.getStockLevels(warehouseId, productId, lowStockOnly, page, limit);
      res.status(200).json(result);
    } catch (error) { next(error); }
  }

  static async getProductStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = parseInt(req.params.productId);
      const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId as string) : undefined;
      const result = await InventoryService.getProductStock(productId, warehouseId);
      res.status(200).json(result);
    } catch (error) { next(error); }
  }

  static async getProductHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = parseInt(req.params.productId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string | undefined;
      const result = await InventoryService.getProductHistory(productId, page, limit, type);
      res.status(200).json(result);
    } catch (error) { next(error); }
  }

  static async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InventoryService.adjustStock(req.body, req.user!.userId);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  static async transferStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InventoryService.transferStock(req.body, req.user!.userId);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }
}