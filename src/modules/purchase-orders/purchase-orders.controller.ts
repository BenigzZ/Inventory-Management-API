import { Request, Response, NextFunction } from 'express';
import { PurchaseOrderService } from './purchase-orders.service';
export class PurchaseOrderController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await PurchaseOrderService.create(req.body, req.user!.userId); res.status(201).json(result); } catch (error) { next(error); } }
  static async findAll(req: Request, res: Response, next: NextFunction): Promise<void> { try { const page = parseInt(req.query.page as string) || 1; const limit = parseInt(req.query.limit as string) || 20; const status = req.query.status as string | undefined; const result = await PurchaseOrderService.findAll(page, limit, status); res.status(200).json(result); } catch (error) { next(error); } }
  static async findById(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await PurchaseOrderService.findById(parseInt(req.params.id)); res.status(200).json(result); } catch (error) { next(error); } }
  static async receive(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await PurchaseOrderService.receive(parseInt(req.params.id), req.body, req.user!.userId); res.status(200).json(result); } catch (error) { next(error); } }
  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await PurchaseOrderService.cancel(parseInt(req.params.id)); res.status(200).json(result); } catch (error) { next(error); } }
}
