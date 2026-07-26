import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { Submission } from "@/models/Submission";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadStreamToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: folder,
        format: "mp4", // Force auto-transcoding to standard cross-browser MP4 video
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectToDatabase();

    const formData = await req.formData();
    const cameraFile = formData.get("cameraVideo") as File | null;
    const screenFile = formData.get("screenVideo") as File | null;

    let videoRecordingUrl = "";
    let screenRecordingUrl = "";

    // 1. Upload Camera Video File to Cloudinary
    if (cameraFile && cameraFile.size > 0) {
      try {
        const bytes = await cameraFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        videoRecordingUrl = await uploadStreamToCloudinary(buffer, "webcam_recordings");
      } catch (err) {
        console.error("Camera upload to Cloudinary error:", err);
      }
    }

    // 2. Upload Screen Video File to Cloudinary
    if (screenFile && screenFile.size > 0) {
      try {
        const bytes = await screenFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        screenRecordingUrl = await uploadStreamToCloudinary(buffer, "screen_recordings");
      } catch (err) {
        console.error("Screen upload to Cloudinary error:", err);
      }
    }

    const updateData: Record<string, any> = {};
    if (videoRecordingUrl) updateData.videoRecordingUrl = videoRecordingUrl;
    if (screenRecordingUrl) updateData.screenRecordingUrl = screenRecordingUrl;

    if (Object.keys(updateData).length > 0) {
      await Submission.updateOne({ _id: params.id }, { $set: updateData });
    }

    return jsonOk({
      success: true,
      videoRecordingUrl,
      screenRecordingUrl,
    });
  } catch (error) {
    console.error("Full recordings FormData upload API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
