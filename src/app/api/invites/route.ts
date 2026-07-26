import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { TestInvite } from "@/models/TestInvite";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    
    // We fetch invites from candidates within the company
    // This requires a join with Candidate or just returning all if companyId is set on TestInvite (which it isn't currently)
    // For now, let's just return a placeholder or do an aggregate.
    
    const invites = await TestInvite.find()
      .populate('candidateId')
      .populate('testId')
      .sort({ createdAt: -1 })
      .limit(50);
      
    const mapped = invites.map(i => ({
      ...i.toObject(),
      id: i._id.toString(),
      test: i.testId ? { ...(i.testId as any).toObject(), id: (i.testId as any)._id.toString() } : null,
      candidate: i.candidateId ? { ...(i.candidateId as any).toObject(), id: (i.candidateId as any)._id.toString() } : null,
    }));

    return jsonOk({ invites: mapped });
  } catch (error) {
    console.error("Get Invites API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
