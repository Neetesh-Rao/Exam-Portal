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

    const scoreAgg = await Submission.aggregate([
      {
        $match: {
          companyId: auth.companyId,
          status: { $in: ["submitted", "auto_submitted", "graded"] }
        }
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: { $ifNull: ["$finalScore", { $ifNull: ["$autoScore", 0] }] } }
        }
      }
    ]);
    const avgScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore || 0) : 0;

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
