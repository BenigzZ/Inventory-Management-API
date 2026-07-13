import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await AuthService.register(req.body); res.status(201).json(result); } catch (error) { next(error); } }
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await AuthService.login(req.body); res.status(200).json(result); } catch (error) { next(error); } }
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> { try { const result = await AuthService.getProfile(req.user!.userId); res.status(200).json(result); } catch (error) { next(error); } }
}
