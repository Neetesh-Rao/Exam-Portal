import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Test } from "@/models/Test";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    const test = await Test.findOne({ _id: params.id, companyId: auth.companyId });
    if (!test) return jsonError("Test not found", 404);

    return jsonOk({ test: { ...test.toObject(), id: test._id.toString() } });
  } catch (error) {
    console.error("Get Test API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    const body = await req.json();

    const test = await Test.findOneAndUpdate(
      { _id: params.id, companyId: auth.companyId },
      { $set: body },
      { new: true }
    );

    if (!test) return jsonError("Test not found", 404);

    return jsonOk({ test: { ...test.toObject(), id: test._id.toString() } });
  } catch (error) {
    console.error("Update Test API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    const test = await Test.findOneAndDelete({ _id: params.id, companyId: auth.companyId });
    if (!test) return jsonError("Test not found", 404);

    return jsonOk({ success: true });
  } catch (error) {
    console.error("Delete Test API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
