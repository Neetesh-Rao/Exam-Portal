import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Question } from "@/models/Question";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    
    const query: any = { companyId: auth.companyId };
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const questions = await Question.find(query).sort({ createdAt: -1 });
    // the UI expects { questions: [...] }
    // but some DB models use _id, Map to id to match old API if needed
    const mapped = questions.map(q => ({
      ...q.toObject(),
      id: q._id.toString()
    }));

    return jsonOk({ questions: mapped });
  } catch (error) {
    console.error("Questions API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    const body = await req.json();

    const question = await Question.create({
      companyId: auth.companyId,
      title: body.title,
      description: body.description,
      type: body.type,
      difficulty: body.difficulty,
      marks: body.marks || 10,
      testCases: body.testCases || [],
      options: body.options || [],
      correctOptionIndex: body.correctOptionIndex,
      createdBy: auth.userId,
    });

    return jsonOk({ question: { ...question.toObject(), id: question._id.toString() } }, 201);
  } catch (error) {
    console.error("Questions API POST error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
