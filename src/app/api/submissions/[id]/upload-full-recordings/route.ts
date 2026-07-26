import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { Submission } from "@/models/Submission";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs/promises";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function saveFileLocally(file: File, prefix: string, subId: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "recordings");
  await fs.mkdir(uploadsDir, { recursive: true });
  
  const ext = file.name.split('.').pop() || 'webm';
  const fileName = `${prefix}-${subId}-${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  await fs.writeFile(filePath, buffer);
  
  return `/uploads/recordings/${fileName}`;
}

async function uploadStreamToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: folder,
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

    // 1. Save Camera Video File
    if (cameraFile && cameraFile.size > 0) {
      try {
        videoRecordingUrl = await saveFileLocally(cameraFile, "camera", params.id);
        const bytes = await cameraFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          const cloudUrl = await uploadStreamToCloudinary(buffer, "webcam_recordings");
          if (cloudUrl) videoRecordingUrl = cloudUrl;
        }
      } catch (err) {
        console.error("Camera video save error:", err);
      }
    }

    // 2. Save Screen Video File
    if (screenFile && screenFile.size > 0) {
      try {
        screenRecordingUrl = await saveFileLocally(screenFile, "screen", params.id);
        const bytes = await screenFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          const cloudUrl = await uploadStreamToCloudinary(buffer, "screen_recordings");
          if (cloudUrl) screenRecordingUrl = cloudUrl;
        }
      } catch (err) {
        console.error("Screen video save error:", err);
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
    console.error("Full recordings upload API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
