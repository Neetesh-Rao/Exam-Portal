import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { verifyRefreshToken, generateAccessToken } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!refreshToken) return jsonError("No refresh token", 401);

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return jsonError("Invalid refresh token", 401);

  await connectToDatabase();
  const user = await User.findById(payload.userId);
  if (!user) return jsonError("User not found", 401);

  const accessToken = generateAccessToken({ userId: user._id.toString(), role: user.role, companyId: user.companyId?.toString() || null });
  
  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15,
    path: "/",
  });

  return jsonOk({ message: "Token refreshed" });
}
