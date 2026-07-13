import { Request, Response, NextFunction } from 'express';
import { ProductService } from './products.service';

export class ProductController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.create(req.body);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  static async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const search = req.query.search as string | undefined;
      const result = await ProductService.findAll(page, limit, categoryId, search);
      res.status(200).json(result);
    } catch (error) { next(error); }
  }

  static async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.findById(parseInt(req.params.id));
      res.status(200).json(result);
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.update(parseInt(req.params.id), req.body);
      res.status(200).json(result);
    } catch (error) { next(error); }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProductService.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) { next(error); }
  }
}