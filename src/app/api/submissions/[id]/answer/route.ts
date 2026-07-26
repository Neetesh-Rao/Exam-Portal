import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { Submission } from "@/models/Submission";
import mongoose from "mongoose";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectToDatabase();
    const body = await req.json();

    const { questionId, answerText, selectedOptionIds, codeAnswer, isMarkedForReview } = body;

    if (!questionId) return jsonError("Question ID is required", 400);

    const submission = await Submission.findById(params.id).select("status answers");
    if (!submission) return jsonError("Submission not found", 404);

    if (submission.status !== "in_progress") {
      return jsonError("Cannot update answer for a completed submission", 403);
    }

    const qObjId = new mongoose.Types.ObjectId(questionId);
    const existingIndex = submission.answers.findIndex(
      (a: any) => a.questionId.toString() === questionId
    );

    if (existingIndex > -1) {
      // Atomic $set on matching array element
      const updateFields: Record<string, any> = {};
      if (answerText !== undefined) updateFields[`answers.${existingIndex}.answerText`] = answerText;
      if (selectedOptionIds !== undefined) updateFields[`answers.${existingIndex}.selectedOptionIds`] = selectedOptionIds;
      if (codeAnswer !== undefined) updateFields[`answers.${existingIndex}.codeAnswer`] = codeAnswer;
      if (isMarkedForReview !== undefined) updateFields[`answers.${existingIndex}.isMarkedForReview`] = isMarkedForReview;

      await Submission.updateOne({ _id: params.id }, { $set: updateFields });
    } else {
      // Atomic $push new answer element
      await Submission.updateOne(
        { _id: params.id },
        {
          $push: {
            answers: {
              questionId: qObjId,
              answerText,
              selectedOptionIds,
              codeAnswer,
              isMarkedForReview: isMarkedForReview || false,
              timeSpentSeconds: 0,
            },
          },
        }
      );
    }

    return jsonOk({ success: true });
  } catch (error) {
    console.error("Save answer error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
