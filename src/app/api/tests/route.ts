import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Test } from "@/models/Test";
import { requireRole } from "@/lib/api-utils";
import { jsonOk, jsonError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["super_admin", "admin", "recruiter", "interviewer"]);
  if (!auth) return jsonError("Unauthorized", 401);

  await connectToDatabase();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");

  const query: any = {};
  if (auth.companyId) query.companyId = auth.companyId;
  if (status) query.status = status;
  if (search) query.title = { $regex: search, $options: "i" };

  const count = await Test.countDocuments(query);
  const rows = await Test.find(query).sort({ createdAt: -1 });
  const mapped = rows.map(t => ({ ...t.toObject(), id: t._id.toString() }));

  return jsonOk({ tests: mapped, total: count });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["super_admin", "admin", "recruiter"]);
  if (!auth) return jsonError("Unauthorized", 401);

  await connectToDatabase();
  const body = await req.json();
  const { title, description, sections, totalDurationSeconds, passPercentage, proctoringConfig } = body;

  if (!title) return jsonError("Title is required", 400);

  const test = await Test.create({
    companyId: auth.companyId,
    title,
    description: description || "",
    sections: sections || [],
    totalDurationSeconds: totalDurationSeconds || 3600,
    passPercentage: passPercentage || 50,
    proctoringConfig: proctoringConfig || {
      tabSwitchLimit: 3,
      fullScreenRequired: true,
      webcamRequired: false,
      disableCopyPaste: true,
      disableRightClick: true,
    },
    status: "draft",
    createdBy: auth.userId,
  });

  return jsonOk({ test: { ...test.toObject(), id: test._id.toString() } }, 201);
}
