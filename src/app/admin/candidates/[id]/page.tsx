"use client";
import { useEffect, useState, use } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface CandidateData {
  candidate: { id: number; name: string; email: string; phone: string | null; source: string | null; createdAt: string };
  submissions: {
    id: number;
    status: string;
    autoScore: number;
    finalScore: number;
    totalMarks: number;
    startedAt: string;
    submittedAt: string;
    test: { id: number; title: string } | null;
    violations: { id: number; type: string; createdAt: string }[];
  }[];
  invites: { id: number; status: string; expiresAt: string; token: string }[];
}

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/candidates/${id}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div>
      <AdminHeader title="Loading..." />
      <div className="p-8 max-w-4xl mx-auto"><CardSkeleton /></div>
    </div>
  );

  if (!data?.candidate) return (
    <div>
      <AdminHeader title="Not Found" />
      <div className="p-8 text-center text-[var(--text-muted)]">Candidate not found.</div>
    </div>
  );

  const { candidate, submissions = [], invites = [] } = data;

  const statusBadge = (s: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "neutral"> = {
      completed: "success", invited: "accent" as "neutral", started: "warning", expired: "danger", in_progress: "warning", submitted: "success", auto_submitted: "danger", graded: "success"
    };
    return <Badge variant={map[s] || "neutral"}>{s.replace("_", " ")}</Badge>;
  };

  return (
    <div>
      <AdminHeader title={candidate.name} subtitle={candidate.email} />
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Profile */}
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-[var(--text-muted)]">Name</p><p className="text-sm font-medium text-[var(--text-primary)]">{candidate.name}</p></div>
            <div><p className="text-xs text-[var(--text-muted)]">Email</p><p className="text-sm font-medium text-[var(--text-primary)]">{candidate.email}</p></div>
            <div><p className="text-xs text-[var(--text-muted)]">Phone</p><p className="text-sm font-medium text-[var(--text-primary)]">{candidate.phone || "—"}</p></div>
            <div><p className="text-xs text-[var(--text-muted)]">Source</p><p className="text-sm font-medium text-[var(--text-primary)]">{candidate.source || "—"}</p></div>
          </div>
        </Card>

        {/* Invites */}
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Test Invitations</h3>
          {invites.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No invitations sent yet.</p>
          ) : (
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 border border-app-border dark:border-dark-border rounded-lg">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Token: {inv.token.substring(0, 8)}...</p>
                    <p className="text-xs text-[var(--text-muted)]">Expires: {new Date(inv.expiresAt).toLocaleDateString()}</p>
                  </div>
                  {statusBadge(inv.status)}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Submissions */}
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Test Submissions</h3>
          {submissions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div key={sub.id} className="p-4 border border-app-border dark:border-dark-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{sub.test?.title || "Unknown Test"}</p>
                      <p className="text-xs text-[var(--text-muted)]">Started: {sub.startedAt ? new Date(sub.startedAt).toLocaleString() : "—"}</p>
                    </div>
                    {statusBadge(sub.status)}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Score</p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">
                        {sub.finalScore ?? sub.autoScore ?? 0}/{sub.totalMarks ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Violations</p>
                      <p className="text-lg font-bold text-danger">{sub.violations?.length || 0}</p>
                    </div>
                  </div>
                  {sub.violations && sub.violations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-app-border dark:border-dark-border">
                      <p className="text-xs text-[var(--text-muted)] mb-2">Violation Log:</p>
                      <div className="flex flex-wrap gap-1">
                        {sub.violations.map((v) => (
                          <Badge key={v.id} variant="danger">{v.type.replace("_", " ")}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
