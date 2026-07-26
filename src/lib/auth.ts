import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "hiring-platform-secret-key-change-in-production";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "hiring-platform-refresh-secret-change-in-production";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: { userId: string; role: string; companyId: string | null }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): { userId: string; role: string; companyId: string | null } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string; companyId: string | null };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload) return null;
  
  await connectToDatabase();
  const user = await User.findById(payload.userId);
  if (!user) return null;
  return { ...user.toObject(), id: user._id, companyId: user.companyId };
}
