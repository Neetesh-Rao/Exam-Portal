import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Test } from "@/models/Test";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    const test = await Test.findOneAndUpdate(
      { _id: params.id, companyId: auth.companyId },
      { status: "published" },
      { new: true }
    );

    if (!test) return jsonError("Test not found", 404);

    return jsonOk({ test: { ...test.toObject(), id: test._id.toString() } });
  } catch (error) {
    console.error("Publish Test API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
