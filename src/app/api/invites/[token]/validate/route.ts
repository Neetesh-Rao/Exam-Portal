import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";
import { TestInvite } from "@/models/TestInvite";
import { Test } from "@/models/Test";
import { Candidate } from "@/models/Candidate";

export async function GET(req: NextRequest, props: { params: Promise<{ token: string }> }) {
  try {
    const params = await props.params;
    await connectToDatabase();

    const invite = await TestInvite.findOne({ token: params.token });
    if (!invite) return jsonOk({ error: "Invalid invitation link." });

    if (invite.status === "expired" || new Date() > new Date(invite.expiresAt)) {
      if (invite.status !== "expired") {
        invite.status = "expired";
        await invite.save();
      }
      return jsonOk({ error: "This invitation link has expired." });
    }

    if (invite.status === "completed") {
      return jsonOk({ error: "This test has already been completed." });
    }

    const test = await Test.findById(invite.testId);
    if (!test) return jsonOk({ error: "The associated test could not be found." });

    const candidate = await Candidate.findById(invite.candidateId);
    if (!candidate) return jsonOk({ error: "Candidate record not found." });

    return jsonOk({
      invite: { ...invite.toObject(), id: invite._id.toString() },
      test: { ...test.toObject(), id: test._id.toString() },
      candidate: { ...candidate.toObject(), id: candidate._id.toString() }
    });
  } catch (error) {
    console.error("Invite validate API error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
