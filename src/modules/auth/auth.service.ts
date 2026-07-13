import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { JwtPayload } from '../../middleware/auth';

export class AuthService {
  static async register(data: any) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({ data: { email: data.email, password: hashedPassword, name: data.name, role: data.role }, select: { id: true, email: true, name: true, role: true } });
    const token = AuthService.generateToken(user.id, user.email, user.role);
    return { user, token };
  }
  static async login(data: any) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    const token = AuthService.generateToken(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
  }
  static async getProfile(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, createdAt: true } });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
  }
  private static generateToken(userId: number, email: string, role: string): string {
    const payload: JwtPayload = { userId, email, role };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  }
}
