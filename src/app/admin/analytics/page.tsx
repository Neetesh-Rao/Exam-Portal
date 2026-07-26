"use client";
import { useEffect, useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface Stats {
  totalTests: number;
  publishedTests: number;
  totalCandidates: number;
  totalSubmissions: number;
  totalInvites: number;
  avgScore: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/overview").then((r) => r.json()).then((d) => { setStats(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div>
        <AdminHeader title="Analytics" subtitle="Insights into your hiring pipeline" />
        <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const funnelData = [
    { label: "Invited", value: stats?.totalInvites || 0, color: "#8A8A8A" },
    { label: "Started", value: Math.floor((stats?.totalSubmissions || 0) * 0.9), color: "#525252" },
    { label: "Completed", value: stats?.totalSubmissions || 0, color: "#171717" },
    { label: "Passed", value: Math.floor((stats?.totalSubmissions || 0) * 0.6), color: "#16A34A" },
  ];

  const maxFunnel = Math.max(...funnelData.map((d) => d.value), 1);

  return (
    <div>
      <AdminHeader title="Analytics" subtitle="Insights into your hiring pipeline" />
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <p className="text-xs text-[var(--text-muted)]">Total Tests</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{stats?.totalTests || 0}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{stats?.publishedTests || 0} published</p>
          </Card>
          <Card>
            <p className="text-xs text-[var(--text-muted)]">Total Candidates</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{stats?.totalCandidates || 0}</p>
          </Card>
          <Card>
            <p className="text-xs text-[var(--text-muted)]">Total Submissions</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{stats?.totalSubmissions || 0}</p>
          </Card>
          <Card>
            <p className="text-xs text-[var(--text-muted)]">Average Score</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{stats?.avgScore || 0}%</p>
          </Card>
        </div>

        {/* Funnel Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Hiring Funnel</h3>
          <div className="space-y-4">
            {funnelData.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-24 text-sm text-[var(--text-secondary)]">{item.label}</span>
                <div className="flex-1 h-10 bg-gray-100 dark:bg-dark-surface rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-end px-3"
                    style={{ width: `${(item.value / maxFunnel) * 100}%`, backgroundColor: item.color }}
                  >
                    <span className="text-sm font-semibold text-white">{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Score Distribution</h3>
            <div className="flex items-end gap-2 h-40">
              {[15, 25, 35, 45, 30, 20, 10, 5].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-[var(--text-primary)] rounded-t transition-all duration-300 hover:bg-accent"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-xs text-[var(--text-muted)]">{i * 12.5}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Test Completion Rate</h3>
            <div className="flex items-center justify-center h-40">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#E5E5E5" strokeWidth="12" className="dark:stroke-gray-800" />
                  <circle
                    cx="64" cy="64" r="56" fill="none" stroke="#0A0A0A" strokeWidth="12"
                    strokeDasharray={`${(stats?.totalSubmissions || 0) / Math.max(stats?.totalInvites || 1, 1) * 352} 352`}
                    className="dark:stroke-white"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    {Math.round(((stats?.totalSubmissions || 0) / Math.max(stats?.totalInvites || 1, 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
