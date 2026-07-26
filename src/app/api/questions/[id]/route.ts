import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Question } from "@/models/Question";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const auth = await requireRole(req, ["super_admin", "admin", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    
    const question = await Question.findOne({ _id: params.id, companyId: auth.companyId });
    if (!question) return jsonError("Question not found", 404);

    return jsonOk({ question: { ...question.toObject(), id: question._id.toString() } });
  } catch (error) {
    console.error("Get Question API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const auth = await requireRole(req, ["super_admin", "admin"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    const body = await req.json();

    const question = await Question.findOneAndUpdate(
      { _id: params.id, companyId: auth.companyId },
      { $set: body },
      { new: true }
    );

    if (!question) return jsonError("Question not found", 404);

    return jsonOk({ question: { ...question.toObject(), id: question._id.toString() } });
  } catch (error) {
    console.error("Update Question API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const auth = await requireRole(req, ["super_admin", "admin"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    
    const question = await Question.findOneAndDelete({ _id: params.id, companyId: auth.companyId });
    if (!question) return jsonError("Question not found", 404);

    return jsonOk({ success: true });
  } catch (error) {
    console.error("Delete Question API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
