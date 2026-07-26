import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { TestInvite } from "@/models/TestInvite";
import { Test } from "@/models/Test";
import { Candidate } from "@/models/Candidate";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["candidate", "admin", "super_admin", "recruiter", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();

    // Find candidate record by userId or email
    const candidate = await Candidate.findById(auth.userId);
    let invites = [];

    if (candidate) {
      invites = await TestInvite.find({ candidateId: candidate._id })
        .populate("testId")
        .sort({ createdAt: -1 });
    } else {
      // Fallback: get all active test invites for testing
      invites = await TestInvite.find()
        .populate("testId")
        .sort({ createdAt: -1 })
        .limit(20);
    }

    const mapped = invites.map((inv) => ({
      id: inv._id.toString(),
      token: inv.token,
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      test: inv.testId
        ? {
            id: (inv.testId as any)._id.toString(),
            title: (inv.testId as any).title,
            description: (inv.testId as any).description,
            totalDurationSeconds: (inv.testId as any).totalDurationSeconds,
            passPercentage: (inv.testId as any).passPercentage,
          }
        : null,
    }));

    return jsonOk({ invites: mapped });
  } catch (error) {
    console.error("Candidate tests API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
