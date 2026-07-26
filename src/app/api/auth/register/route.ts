import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { Company } from "@/models/Company";
import { hashPassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, companyName, role } = body;

    if (!name || !email || !password) {
      return jsonError("Name, email, and password are required", 400);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return jsonError("Email already registered", 409);
    }

    const passwordHash = await hashPassword(password);

    // Create company if provided
    let companyId = null;
    if (companyName) {
      const company = await Company.create({
        name: companyName,
        plan: "free",
      });
      companyId = company._id;
    }

    const userRole = role === "candidate" ? "candidate" : "admin";

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: userRole,
      companyId,
    });

    const accessToken = generateAccessToken({ userId: user._id.toString(), role: user.role, companyId: user.companyId?.toString() || null });
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    const cookieStore = await cookies();
    cookieStore.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/",
    });
    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return jsonOk({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, companyId: user.companyId },
    }, 201);
  } catch (error) {
    console.error("Register error:", error);
    return jsonError("Internal server error", 500);
  }
}
