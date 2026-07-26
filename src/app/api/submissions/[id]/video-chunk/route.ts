import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { Submission } from "@/models/Submission";
import mongoose from "mongoose";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectToDatabase();
    const body = await req.json();
    const { videoChunkUrl } = body;

    if (!videoChunkUrl) return jsonError("videoChunkUrl is required", 400);

    const subId = mongoose.Types.ObjectId.isValid(params.id)
      ? new mongoose.Types.ObjectId(params.id)
      : params.id;

    // Preserve existing valid video recording URLs (local file or Cloudinary)
    const existing = await Submission.findById(subId).select("videoRecordingUrl").lean();
    if (existing && (!existing.videoRecordingUrl || (!existing.videoRecordingUrl.startsWith("/uploads/") && !existing.videoRecordingUrl.startsWith("http")))) {
      await Submission.updateOne(
        { _id: subId },
        { $set: { videoRecordingUrl: videoChunkUrl } }
      );
    }

    return jsonOk({ success: true }, 201);
  } catch (error) {
    console.error("Video chunk API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
