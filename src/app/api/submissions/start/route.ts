import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { TestInvite } from "@/models/TestInvite";
import { Submission } from "@/models/Submission";
import { Test } from "@/models/Test";
import { Question } from "@/models/Question";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { token } = body;

    if (!token) return jsonError("Token is required", 400);

    const invite = await TestInvite.findOne({ token });
    if (!invite) return jsonOk({ error: "Invalid token" });

    if (invite.status === "expired" || new Date() > new Date(invite.expiresAt)) {
      if (invite.status !== "expired") {
        invite.status = "expired";
        await invite.save();
      }
      return jsonOk({ error: "Invitation expired" });
    }

    if (invite.status === "completed") {
      return jsonOk({ error: "Test already completed" });
    }

    const test = await Test.findById(invite.testId);
    if (!test) return jsonOk({ error: "Test not found" });

    // Check if submission already exists (for resume)
    let submission = await Submission.findOne({ testId: invite.testId, candidateId: invite.candidateId });

    if (!submission) {
      // Create new submission
      submission = await Submission.create({
        companyId: test.companyId,
        testId: invite.testId,
        candidateId: invite.candidateId,
        inviteId: invite._id,
        answers: [],
        status: 'in_progress',
        startedAt: new Date(),
      });
      
      // Update invite status
      invite.status = 'started';
      await invite.save();
    }
    
    // Fetch questions and scrub correct answers
    const questions = [];
    if (test && test.sections) {
      for (const section of test.sections) {
        if (section.questionIds && section.questionIds.length > 0) {
          const qDocs = await Question.find({ _id: { $in: section.questionIds } });
          for (const q of qDocs) {
            const qObj = q.toObject();
            qObj.id = qObj._id.toString();
            if (qObj.options) {
              qObj.options = qObj.options.map((o: any) => ({
                id: o.id,
                text: o.text
                // Exclude isCorrect
              }));
            }
            questions.push(qObj);
          }
        }
      }
    }

    return jsonOk({ 
      submission: { ...submission.toObject(), id: submission._id.toString() },
      test: test ? { ...test.toObject(), id: test._id.toString() } : null,
      questions
    }, 201);
  } catch (error) {
    console.error("Submission start error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
