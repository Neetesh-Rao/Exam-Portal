import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { Submission } from "@/models/Submission";
import { Question } from "@/models/Question";
import { TestInvite } from "@/models/TestInvite";
import mongoose from "mongoose";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectToDatabase();
    const body = await req.json();

    const { autoSubmitted } = body;

    const submission = await Submission.findById(params.id);
    if (!submission) return jsonError("Submission not found", 404);

    if (submission.status !== "in_progress") {
      return jsonError("Test already submitted", 400);
    }

    // Auto grade MCQs
    let autoScore = 0;
    for (const answer of submission.answers) {
      const question = await Question.findById(answer.questionId);
      if (!question) continue;

      if (['mcq_single', 'mcq_multi', 'true_false'].includes(question.type)) {
        const correctOptions = question.options.filter((o: any) => o.isCorrect).map((o: any) => o.id);
        const selectedOptions = answer.selectedOptionIds || [];

        // Simple exact match grading
        if (
          correctOptions.length === selectedOptions.length &&
          correctOptions.every((val: any) => selectedOptions.includes(val))
        ) {
          autoScore += question.marks;
        }
      }
    }

    submission.autoScore = autoScore;
    submission.finalScore = autoScore; // Can be updated by manual grading later
    submission.status = autoSubmitted ? "auto_submitted" : "submitted";
    submission.submittedAt = new Date();
    await submission.save();

    // Update invite status
    const invite = await TestInvite.findById(submission.inviteId);
    if (invite) {
      invite.status = 'completed';
      await invite.save();
    }

    return jsonOk({ success: true, submission: { ...submission.toObject(), id: submission._id.toString() } }, 201);
  } catch (error) {
    console.error("Submit test error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
