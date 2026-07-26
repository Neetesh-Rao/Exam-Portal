import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Candidate } from "@/models/Candidate";
import { Submission } from "@/models/Submission";
import { TestInvite } from "@/models/TestInvite";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    
    // Check if valid ObjectId if needed, but Mongoose usually casts it or throws
    const candidate = await Candidate.findOne({ _id: params.id, companyId: auth.companyId });
    if (!candidate) return jsonError("Candidate not found", 404);

    // Also fetch their submissions for the profile page
    const submissions = await Submission.find({ candidateId: candidate._id })
      .populate('testId')
      .sort({ createdAt: -1 });

    const mappedSubmissions = submissions.map(s => ({
      ...s.toObject(),
      id: s._id.toString()
    }));

    const invites = await TestInvite.find({ candidateId: candidate._id })
      .sort({ createdAt: -1 });

    const mappedInvites = invites.map(i => ({
      ...i.toObject(),
      id: i._id.toString()
    }));

    return jsonOk({ 
      candidate: { ...candidate.toObject(), id: candidate._id.toString() },
      submissions: mappedSubmissions,
      invites: mappedInvites
    });
  } catch (error) {
    console.error("Get Candidate API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
