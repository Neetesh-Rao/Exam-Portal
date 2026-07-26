import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { jsonOk, jsonError, requireRole } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer", "candidate"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    const user = await User.findById(auth.userId).select("-passwordHash");
    if (!user) return jsonError("User not found", 404);

    return jsonOk({ user });
  } catch (error) {
    return jsonError("Internal server error", 500);
  }
}
