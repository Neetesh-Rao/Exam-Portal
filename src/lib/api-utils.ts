import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./auth";

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAuth(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function requireRole(req: NextRequest, roles: string[]) {
  const auth = await requireAuth(req);
  if (!auth) return null;
  if (!roles.includes(auth.role)) return null;
  return auth;
}
