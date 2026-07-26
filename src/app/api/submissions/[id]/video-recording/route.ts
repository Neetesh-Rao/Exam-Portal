import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { Submission } from "@/models/Submission";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectToDatabase();
    const body = await req.json();
    const { videoDataUrl } = body;

    if (!videoDataUrl) return jsonError("videoDataUrl is required", 400);

    const submission = await Submission.findById(params.id);
    if (!submission) return jsonError("Submission not found", 404);

    submission.videoRecordingUrl = videoDataUrl;
    await submission.save();

    return jsonOk({ success: true }, 201);
  } catch (error) {
    console.error("Save video recording error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
