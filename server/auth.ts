import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function getCurrentUser(req: Request) {
  if (!req.session?.userId) {
    return null;
  }
  return await storage.getUser(req.session.userId);
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}