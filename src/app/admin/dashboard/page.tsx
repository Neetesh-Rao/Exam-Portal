"use client";
import { useEffect, useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface Stats {
  totalTests: number;
  publishedTests: number;
  totalCandidates: number;
  totalSubmissions: number;
  totalInvites: number;
  avgScore: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/overview")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: "Total Tests", value: stats.totalTests, icon: "📋", change: `${stats.publishedTests} published` },
    { label: "Candidates", value: stats.totalCandidates, icon: "👥", change: `${stats.totalInvites} invited` },
    { label: "Submissions", value: stats.totalSubmissions, icon: "📄", change: "All time" },
    { label: "Avg Score", value: `${stats.avgScore}%`, icon: "📊", change: "Across all tests" },
  ] : [];

  return (
    <div>
      <AdminHeader title="Dashboard" subtitle="Overview of your hiring pipeline" />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            statCards.map((stat, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-muted)]">{stat.label}</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1 tracking-tight">{stat.value}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{stat.change}</p>
                  </div>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { href: "/admin/tests/new", emoji: "✏️", title: "Create New Test", desc: "Build a new assessment" },
                { href: "/admin/questions", emoji: "❓", title: "Manage Questions", desc: "Add or edit question bank" },
                { href: "/admin/candidates", emoji: "👥", title: "Invite Candidates", desc: "Send test invitations" },
              ].map((item) => (
                <a key={item.href} href={item.href} className="flex items-center justify-between p-3 rounded-lg border border-app-border dark:border-dark-border hover:border-app-border-strong dark:hover:border-gray-700 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center group-hover:bg-accent-subtle transition-colors">
                      <span className="text-lg">{item.emoji}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Platform Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">System Status</span>
                <Badge variant="success">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Current Plan</span>
                <Badge variant="accent">Free</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">API Status</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="pt-3 border-t border-app-border dark:border-dark-border">
                <a href="/admin/settings" className="text-sm font-medium text-accent hover:text-accent-hover">
                  Manage Settings →
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
