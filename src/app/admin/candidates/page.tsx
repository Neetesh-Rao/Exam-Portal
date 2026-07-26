"use client";
import { useEffect, useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  source: string | null;
  createdAt: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "" });

  const loadCandidates = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/candidates?${params}`);
    const data = await res.json();
    setCandidates(data.candidates || []);
    setLoading(false);
  };

  useEffect(() => { loadCandidates(); }, [search]);

  const handleCreate = async () => {
    setSaving(true);
    await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowCreate(false);
    setForm({ name: "", email: "", phone: "", source: "" });
    loadCandidates();
  };

  return (
    <div>
      <AdminHeader title="Candidates" subtitle="Manage candidate profiles" />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Input placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Button onClick={() => setShowCreate(true)}>+ Add Candidate</Button>
        </div>

        {loading ? (
          <Card><TableSkeleton /></Card>
        ) : candidates.length === 0 ? (
          <Card>
            <EmptyState
              title="No candidates yet"
              description="Add candidates to invite them to tests"
              actionLabel="Add Candidate"
              onAction={() => setShowCreate(true)}
            />
          </Card>
        ) : (
          <Card className="overflow-hidden !p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app-border dark:border-dark-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Source</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default dark:divide-dk-border">
                {candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-app-bg-subtle dark:hover:bg-dark-surface transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-[var(--text-secondary)]">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{c.email}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{c.phone || "—"}</td>
                    <td className="px-6 py-4">{c.source ? <Badge variant="neutral">{c.source}</Badge> : "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <a href={`/admin/candidates/${c.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Candidate">
          <div className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g., LinkedIn, Referral" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!form.name || !form.email}>Add Candidate</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
