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
      .populate('candidateId')
      .lean();
      
    if (!submission) return jsonError("Submission not found", 404);

    const violations = await ViolationLog.find({ submissionId: submission._id }).lean();

    // Fetch all questions for this test to show the full test and answers
    const test: any = submission.testId;
    let questions: any[] = [];
    if (test && test.sections) {
      const qIds = test.sections.flatMap((s: any) => s.questionIds || []);
      questions = await Question.find({ _id: { $in: qIds } }).lean();
    }

    const candObj = submission.candidateId as any;
    const testObj = submission.testId as any;

    const mappedSub = {
      ...submission,
      id: submission._id.toString(),
      candidate: candObj ? { ...candObj, id: candObj._id ? candObj._id.toString() : "" } : null,
      test: testObj ? { ...testObj, id: testObj._id ? testObj._id.toString() : "" } : null,
      violations: violations.map(v => ({ ...v, id: v._id.toString() })),
      questions: questions.map(q => ({ ...q, id: q._id.toString() }))
    };

    return jsonOk({
      submission: mappedSub,
      candidate: mappedSub.candidate,
      test: mappedSub.test,
      questions: mappedSub.questions,
      violations: mappedSub.violations,
    });
  } catch (error) {
    console.error("Get Submission API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
