"use client";

import { useEffect, useState, use } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { CheckCircle2, ShieldAlert, Clock, User, Award, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SubmissionResult {
  id: string;
  status: string;
  autoScore: number;
  manualScore: number;
  finalScore: number;
  startedAt: string;
  submittedAt: string;
  test: {
    title: string;
    description: string;
    totalDurationSeconds: number;
  } | null;
  candidate: {
    name: string;
    email: string;
  } | null;
  violations: { id: string; type: string; createdAt: string }[];
}

export default function ResultPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = use(params);
  const [data, setData] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/submissions/${submissionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.submission) setData(d.submission);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [submissionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <Card className="bg-neutral-900 border-neutral-800 text-center max-w-md p-8">
          <h2 className="text-xl font-bold mb-2">Submission Not Found</h2>
          <p className="text-sm text-neutral-400 mb-6">Unable to retrieve assessment submission data.</p>
          <Link href="/candidate/dashboard">
            <Button className="bg-white text-black hover:bg-neutral-200">Return to Portal</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation */}
        <Link
          href="/candidate/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </Link>

        {/* Top Header Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 text-xs font-medium text-neutral-300 border border-neutral-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Assessment Submission Report
            </div>
            <Badge variant="neutral">{data.status.replace("_", " ")}</Badge>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{data.test?.title || "Assessment"}</h1>
            <p className="text-sm text-neutral-400 mt-1">Candidate: {data.candidate?.name} ({data.candidate?.email})</p>
          </div>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Total Final Score</p>
            <p className="text-4xl font-extrabold text-white mt-2">{data.finalScore || data.autoScore || 0}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Auto Score</p>
            <p className="text-3xl font-bold text-neutral-200 mt-2">{data.autoScore || 0}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Manual Score</p>
            <p className="text-3xl font-bold text-neutral-200 mt-2">{data.manualScore || 0}</p>
          </div>
        </div>

        {/* Proctoring Summary */}
        <Card className="bg-neutral-900 border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-neutral-400" />
              Proctoring Violation History
            </h3>
            <span className="text-xs text-neutral-400 font-semibold">{data.violations?.length || 0} Events Detected</span>
          </div>

          {!data.violations || data.violations.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">No proctoring violations recorded during this test session.</p>
          ) : (
            <div className="space-y-2">
              {data.violations.map((v) => (
                <div key={v.id} className="flex items-center justify-between bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs">
                  <span className="font-semibold text-neutral-200">{v.type.replace("_", " ").toUpperCase()}</span>
                  <span className="text-neutral-500">{new Date(v.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
