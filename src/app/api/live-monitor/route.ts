import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Submission } from "@/models/Submission";
import { ViolationLog } from "@/models/ViolationLog";
import { Test } from "@/models/Test";
import { Candidate } from "@/models/Candidate";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();

    // Fetch active or recent submissions
    const submissions = await Submission.find({ companyId: auth.companyId })
      .populate("candidateId")
      .populate("testId")
      .sort({ updatedAt: -1 })
      .limit(30);

    const liveSessions = await Promise.all(
      submissions.map(async (sub) => {
        const violations = await ViolationLog.find({ submissionId: sub._id });
        const lastViolation = violations.length > 0 ? violations[violations.length - 1] : null;

        return {
          id: sub._id.toString(),
          candidateName: (sub.candidateId as any)?.name || "Unknown Candidate",
          candidateEmail: (sub.candidateId as any)?.email || "N/A",
          testTitle: (sub.testId as any)?.title || "Technical Assessment",
          status: sub.status,
          startedAt: sub.startedAt,
          submittedAt: sub.submittedAt,
          violationCount: violations.length,
          lastViolationType: lastViolation?.type || null,
          tabSwitchLimit: (sub.testId as any)?.proctoringConfig?.tabSwitchLimit || 3,
        };
      })
    );

    return jsonOk({ sessions: liveSessions });
  } catch (error) {
    console.error("Live Monitor API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
