import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Notification } from "@/models/Notification";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    
    // In a real app, you might want to filter by userId, but for now we'll get company notifications
    const notifications = await Notification.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .limit(50);
      
    const mapped = notifications.map(n => ({
      ...n.toObject(),
      id: n._id.toString()
    }));

    return jsonOk({ notifications: mapped });
  } catch (error) {
    console.error("Get Notifications API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
