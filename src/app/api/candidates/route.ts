import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Candidate } from "@/models/Candidate";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    
    const candidates = await Candidate.find({ companyId: auth.companyId }).sort({ createdAt: -1 });
    const mapped = candidates.map(c => ({
      ...c.toObject(),
      id: c._id.toString()
    }));

    return jsonOk({ candidates: mapped });
  } catch (error) {
    console.error("Candidates API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter"]);
    if (!auth) return jsonError("Unauthorized", 401);

    await connectToDatabase();
    const body = await req.json();

    const { name, email, phone, source } = body;
    if (!name || !email) return jsonError("Name and email are required", 400);

    const candidate = await Candidate.create({
      companyId: auth.companyId,
      name,
      email,
      phone,
      source
    });

    return jsonOk({ candidate: { ...candidate.toObject(), id: candidate._id.toString() } }, 201);
  } catch (error) {
    console.error("Candidates API POST error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
