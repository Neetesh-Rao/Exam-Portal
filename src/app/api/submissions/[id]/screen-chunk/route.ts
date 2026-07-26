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
    const { screenChunkUrl } = body;

    if (!screenChunkUrl) return jsonError("screenChunkUrl is required", 400);

    const subId = mongoose.Types.ObjectId.isValid(params.id)
      ? new mongoose.Types.ObjectId(params.id)
      : params.id;

    // Update screen recording stream URL atomically
    await Submission.updateOne(
      { _id: subId },
      {
        $set: { screenRecordingUrl: screenChunkUrl },
      }
    );

    return jsonOk({ success: true }, 201);
  } catch (error) {
    console.error("Screen chunk API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
