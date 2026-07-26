import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { comparePassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonError("Email and password are required", 400);
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Check Candidate model for test-taker login
      const { Candidate } = await import("@/models/Candidate");
      const candidateDoc = await Candidate.findOne({ email });
      if (candidateDoc) {
        // Log in as candidate role
        const accessToken = generateAccessToken({ userId: candidateDoc._id.toString(), role: "candidate", companyId: candidateDoc.companyId?.toString() || null });
        const refreshToken = generateRefreshToken({ userId: candidateDoc._id.toString() });

        const cookieStore = await cookies();
        cookieStore.set("access_token", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 2, path: "/" });
        cookieStore.set("refresh_token", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });

        return jsonOk({
          user: { id: candidateDoc._id, name: candidateDoc.name, email: candidateDoc.email, role: "candidate", companyId: candidateDoc.companyId },
        });
      }

      return jsonError("Invalid email or password", 401);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return jsonError("Invalid email or password", 401);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

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
    });
  } catch (error) {
    console.error("Login error:", error);
    return jsonError("Internal server error", 500);
  }
}
