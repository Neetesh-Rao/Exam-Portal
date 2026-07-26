import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Submission } from "@/models/Submission";
import { Test } from "@/models/Test";
import { Candidate } from "@/models/Candidate";
import { Question } from "@/models/Question";
import { ViolationLog } from "@/models/ViolationLog";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    
    const submission = await Submission.findById(params.id)
      .populate('testId')
      .populate('candidateId');
      
    if (!submission) return jsonError("Submission not found", 404);

    const violations = await ViolationLog.find({ submissionId: submission._id });

    // Fetch all questions for this test to show the full test and answers
    const test = await Test.findById(submission.testId);
    let questions = [];
    if (test && test.sections) {
      const qIds = test.sections.flatMap((s: any) => s.questionIds || []);
      questions = await Question.find({ _id: { $in: qIds } });
    }

    const mappedSub = {
      ...submission.toObject(),
      id: submission._id.toString(),
      test: submission.testId ? { ...(submission.testId as any).toObject(), id: (submission.testId as any)._id.toString() } : null,
      candidate: submission.candidateId ? { ...(submission.candidateId as any).toObject(), id: (submission.candidateId as any)._id.toString() } : null,
      violations: violations.map(v => ({ ...v.toObject(), id: v._id.toString() })),
      questions: questions.map(q => ({ ...q.toObject(), id: q._id.toString() }))
    };

    return jsonOk({ submission: mappedSub });
  } catch (error) {
    console.error("Get Submission API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
