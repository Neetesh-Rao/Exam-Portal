import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/lib/api-utils";
import { Candidate } from "@/models/Candidate";
import { TestInvite } from "@/models/TestInvite";
import { Test } from "@/models/Test";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["super_admin", "admin", "recruiter"]);
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { testId, candidateEmails, expiresInDays = 7 } = body;

    if (!testId || !candidateEmails || !candidateEmails.length) {
      return jsonError("Missing required fields", 400);
    }

    await connectToDatabase();

    const test = await Test.findOne({ _id: testId, companyId: auth.companyId });
    if (!test) return jsonError("Test not found", 404);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const createdInvites = [];

    for (const email of candidateEmails) {
      // Find or create candidate
      let candidate = await Candidate.findOne({ email, companyId: auth.companyId });
      if (!candidate) {
        candidate = await Candidate.create({
          companyId: auth.companyId,
          email,
          name: email.split("@")[0], // Fallback name
        });
      }

      // Generate unique token
      const token = crypto.randomBytes(32).toString("hex");

      // Create invite
      const invite = await TestInvite.create({
        testId: test._id,
        candidateId: candidate._id,
        token,
        expiresAt,
        status: "invited"
      });

      createdInvites.push({
        token: invite.token,
        email: candidate.email
      });
    }

    return jsonOk({ invites: createdInvites }, 201);
  } catch (error) {
    console.error("Bulk Invite API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
