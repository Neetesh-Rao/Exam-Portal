import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Submission } from "@/models/Submission";
import { Candidate } from "@/models/Candidate";
import { Test } from "@/models/Test";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();

    let query: any = {};
    if (auth.companyId) {
      query = {
        $or: [
          { companyId: auth.companyId },
          { companyId: { $exists: false } },
        ],
      };
    }

    const submissions = await Submission.find(query)
      .select("-recordingSnapshots")
      .populate("candidateId")
      .populate("testId")
      .sort({ createdAt: -1 })
      .lean();

    const mapped = submissions.map((s: any) => {
      const candObj = s.candidateId ? s.candidateId : null;
      const testObj = s.testId ? s.testId : null;

      return {
        ...s,
        id: s._id.toString(),
        candidate: candObj ? { ...candObj, id: candObj._id ? candObj._id.toString() : "" } : null,
        test: testObj ? { ...testObj, id: testObj._id ? testObj._id.toString() : "" } : null,
        finalScore: s.finalScore ?? s.autoScore ?? 0,
        autoScore: s.autoScore ?? 0,
        manualScore: s.manualScore ?? 0,
        totalMarks: testObj?.totalMarks || 100,
      };
    });

    return jsonOk({ submissions: mapped });
  } catch (error) {
    console.error("Submissions API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
