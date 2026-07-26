import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Test } from "@/models/Test";
import { Candidate } from "@/models/Candidate";
import { Submission } from "@/models/Submission";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["super_admin", "admin"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();

    const [totalTests, totalCandidates, totalSubmissions] = await Promise.all([
      Test.countDocuments({ companyId: auth.companyId }),
      Candidate.countDocuments({ companyId: auth.companyId }),
      Submission.countDocuments({ companyId: auth.companyId }),
    ]);

    const submissions = await Submission.find({ 
      companyId: auth.companyId, 
      status: { $in: ["submitted", "auto_submitted", "graded"] } 
    });
    const totalScore = submissions.reduce((acc, sub) => acc + (sub.finalScore || sub.autoScore || 0), 0);
    const avgScore = submissions.length > 0 ? Math.round(totalScore / submissions.length) : 0;

    return jsonOk({
      totalTests,
      totalCandidates,
      totalSubmissions,
      avgScore,
      recentActivity: []
    });
  } catch (error) {
    console.error("Overview API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
