import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { ViolationLog } from "@/models/ViolationLog";
import { Submission } from "@/models/Submission";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectToDatabase();
    const body = await req.json();

    const { type } = body;
    if (!type) return jsonError("Violation type is required", 400);

    const submission = await Submission.findById(params.id);
    if (!submission) return jsonError("Submission not found", 404);

    await ViolationLog.create({
      submissionId: submission._id,
      testId: submission.testId,
      candidateId: submission.candidateId,
      type
    });

    return jsonOk({ success: true }, 201);
  } catch (error) {
    console.error("Violation log error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
