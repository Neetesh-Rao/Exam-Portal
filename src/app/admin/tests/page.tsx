"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Test {
  id: number;
  title: string;
  description: string;
  status: string;
  totalDurationSeconds: number;
  passPercentage: number;
  sections: { questionIds: number[] }[];
  createdAt: string;
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    const res = await fetch("/api/tests");
    const data = await res.json();
    setTests(data.tests || []);
    setLoading(false);
  };

  const deleteTest = async (id: number) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    await fetch(`/api/tests/${id}`, { method: "DELETE" });
    loadTests();
  };

  const filtered = tests.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (s: string) => {
    const map: Record<string, "success" | "warning" | "neutral"> = { published: "success", draft: "warning", archived: "neutral" };
    return <Badge variant={map[s] || "neutral"}>{s}</Badge>;
  };

  return (
    <div>
      <AdminHeader title="Tests" subtitle="Manage your assessments" />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Input
            placeholder="Search tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Link href="/admin/tests/new">
            <Button>+ Create Test</Button>
          </Link>
        </div>

        {loading ? (
          <Card><TableSkeleton /></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              title="No tests yet"
              description="Create your first assessment to start evaluating candidates"
              actionLabel="Create Test"
              onAction={() => window.location.href = "/admin/tests/new"}
            />
          </Card>
        ) : (
          <Card className="overflow-hidden !p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app-border dark:border-dark-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Duration</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Questions</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Pass %</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default dark:divide-dk-border">
                {filtered.map((test) => (
                  <tr key={test.id} className="hover:bg-app-bg-subtle dark:hover:bg-dark-surface transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/tests/${test.id}`} className="text-sm font-medium text-[var(--text-primary)] hover:text-accent">
                        {test.title}
                      </Link>
                      {test.description && <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{test.description}</p>}
                    </td>
                    <td className="px-6 py-4">{statusBadge(test.status)}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{Math.floor(test.totalDurationSeconds / 60)} min</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{(test.sections || []).reduce((sum, s) => sum + (s.questionIds?.length || 0), 0)}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{test.passPercentage}%</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/tests/${test.id}`}>
                          <Button variant="ghost" size="sm">View Details</Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => deleteTest(test.id)}>
                          <span className="text-danger">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
