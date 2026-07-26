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
    const { imageUrl, event } = body;

    if (!imageUrl) return jsonError("Image URL/data is required", 400);

    const subId = mongoose.Types.ObjectId.isValid(params.id)
      ? new mongoose.Types.ObjectId(params.id)
      : params.id;

    // Slice to keep max 15 snapshots so BSON document size stays under ~500KB
    await Submission.updateOne(
      { _id: subId },
      {
        $push: {
          recordingSnapshots: {
            $each: [
              {
                timestamp: new Date(),
                imageUrl,
                event: event || "snapshot",
              },
            ],
            $slice: -15,
          },
        },
      }
    );

    return jsonOk({ success: true }, 201);
  } catch (error) {
    console.error("Webcam snapshot API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
