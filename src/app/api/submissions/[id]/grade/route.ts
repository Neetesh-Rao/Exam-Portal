import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Submission } from "@/models/Submission";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const auth = await requireRole(req, ["super_admin", "admin", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    const body = await req.json();
    const { manualScore, feedback } = body;

    const submission = await Submission.findById(params.id);
    if (!submission) return jsonError("Submission not found", 404);

    submission.manualScore = Number(manualScore) || 0;
    submission.finalScore = (submission.autoScore || 0) + submission.manualScore;
    submission.status = "graded";
    await submission.save();

    return jsonOk({ success: true, submission: { ...submission.toObject(), id: submission._id.toString() } });
  } catch (error) {
    console.error("Grade submission error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
