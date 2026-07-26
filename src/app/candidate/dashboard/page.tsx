"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Clock, ShieldAlert, CheckCircle2, ArrowRight, Award, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface TestInvite {
  id: string;
  token: string;
  status: "invited" | "started" | "completed" | "expired";
  expiresAt: string;
  createdAt: string;
  test: {
    id: string;
    title: string;
    description: string;
    totalDurationSeconds: number;
    passPercentage: number;
  } | null;
}

export default function CandidateDashboardPage() {
  const [invites, setInvites] = useState<TestInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/candidate/tests")
      .then((r) => r.json())
      .then((d) => {
        setInvites(d.invites || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="neutral">Completed</Badge>;
      case "started":
        return <Badge variant="accent">In Progress</Badge>;
      case "expired":
        return <Badge variant="danger">Expired</Badge>;
      default:
        return <Badge variant="neutral">Invited</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* Header Bar */}
      <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-lg tracking-wider">
              H
            </div>
            <div>
              <h1 className="font-semibold text-white text-base tracking-tight">Candidate Portal</h1>
              <p className="text-xs text-neutral-400">Assessments & Test Invitations</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 text-xs font-medium text-neutral-300 mb-3 border border-neutral-700">
              <Award className="w-3.5 h-3.5" /> Assessment Center
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Your Assigned Assessments</h2>
            <p className="text-sm text-neutral-400 mt-1 max-w-xl">
              Welcome to your assessment dashboard. Please ensure you are in a quiet environment with a working camera and stable internet before launching an exam.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{invites.filter((i) => i.status !== "completed").length}</p>
              <p className="text-xs text-neutral-400">Pending</p>
            </div>
            <div className="w-px h-8 bg-neutral-800"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{invites.filter((i) => i.status === "completed").length}</p>
              <p className="text-xs text-neutral-400">Completed</p>
            </div>
          </div>
        </motion.div>

        {/* Tests List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <span>Available Tests</span>
          </h3>

          {loading ? (
            <Card className="bg-neutral-900 border-neutral-800">
              <TableSkeleton />
            </Card>
          ) : invites.length === 0 ? (
            <Card className="bg-neutral-900 border-neutral-800 text-center py-12">
              <EmptyState
                title="No assigned tests found"
                description="You currently don't have any pending test invitations. Please check back later or ask your recruiter for your assessment link."
              />
            </Card>
          ) : (
            <div className="grid gap-4">
              {invites.map((invite) => {
                const durationMinutes = Math.floor((invite.test?.totalDurationSeconds || 3600) / 60);
                const isCompleted = invite.status === "completed";
                const isExpired = invite.status === "expired";

                return (
                  <motion.div
                    key={invite.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-semibold text-white tracking-tight">
                          {invite.test?.title || "Technical Assessment"}
                        </h4>
                        {getStatusBadge(invite.status)}
                      </div>
                      <p className="text-sm text-neutral-400 max-w-2xl line-clamp-2">
                        {invite.test?.description || "Complete this assessment to proceed to the next hiring stage."}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {durationMinutes} mins duration
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Proctored Assessment
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {isCompleted ? (
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 bg-neutral-950 px-4 py-2.5 rounded-lg border border-neutral-800">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          Test Submitted
                        </div>
                      ) : isExpired ? (
                        <div className="text-xs text-neutral-500 font-medium px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                          Link Expired
                        </div>
                      ) : (
                        <Link
                          href={`/take-test/${invite.token}`}
                          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 font-medium text-sm px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Start Test
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
