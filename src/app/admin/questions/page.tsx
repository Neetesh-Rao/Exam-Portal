"use client";
import { useEffect, useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Question {
  id: number;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  tags: string[];
  options: { id: string; text: string; isCorrect: boolean }[];
  correctTextAnswer: string | null;
  codeConfig: { language: string; starterCode: string; disablePaste: boolean } | null;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "mcq_single",
    difficulty: "medium",
    marks: 1,
    negativeMarks: 0,
    tags: "",
    correctTextAnswer: "",
    options: [
      { id: "a", text: "", isCorrect: true },
      { id: "b", text: "", isCorrect: false },
      { id: "c", text: "", isCorrect: false },
      { id: "d", text: "", isCorrect: false },
    ],
    codeLanguage: "javascript",
    starterCode: "",
    disablePaste: false,
  });

  const loadQuestions = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    if (diffFilter) params.set("difficulty", diffFilter);
    const res = await fetch(`/api/questions?${params}`);
    const data = await res.json();
    setQuestions(data.questions || []);
    setLoading(false);
  };

  useEffect(() => { loadQuestions(); }, [search, typeFilter, diffFilter]);

  const handleCreate = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      type: form.type,
      difficulty: form.difficulty,
      marks: form.marks,
      negativeMarks: form.negativeMarks,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    if (["mcq_single", "mcq_multi", "true_false"].includes(form.type)) {
      payload.options = form.options;
    }
    if (form.type === "fill_blank") {
      payload.correctTextAnswer = form.correctTextAnswer;
    }
    if (form.type === "coding") {
      payload.codeConfig = { language: form.codeLanguage, starterCode: form.starterCode, disablePaste: form.disablePaste };
    }

    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setShowCreate(false);
    setForm({
      title: "", description: "", type: "mcq_single", difficulty: "medium", marks: 1, negativeMarks: 0,
      tags: "", correctTextAnswer: "", options: [
        { id: "a", text: "", isCorrect: true },
        { id: "b", text: "", isCorrect: false },
        { id: "c", text: "", isCorrect: false },
        { id: "d", text: "", isCorrect: false },
      ],
      codeLanguage: "javascript", starterCode: "", disablePaste: false,
    });
    loadQuestions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    loadQuestions();
  };

  const diffBadge = (d: string) => {
    const map: Record<string, "success" | "warning" | "danger"> = { easy: "success", medium: "warning", hard: "danger" };
    return <Badge variant={map[d] || "neutral"}>{d}</Badge>;
  };

  const typeLabel = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div>
      <AdminHeader title="Question Bank" subtitle="Manage your assessment questions" />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: "", label: "All Types" },
                { value: "mcq_single", label: "MCQ Single" },
                { value: "mcq_multi", label: "MCQ Multiple" },
                { value: "true_false", label: "True/False" },
                { value: "fill_blank", label: "Fill Blank" },
                { value: "text_area", label: "Text Area" },
                { value: "coding", label: "Coding" },
              ]}
            />
            <Select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              options={[
                { value: "", label: "All Difficulty" },
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Hard" },
              ]}
            />
          </div>
          <Button onClick={() => setShowCreate(true)}>+ Add Question</Button>
        </div>

        {loading ? (
          <Card><TableSkeleton /></Card>
        ) : questions.length === 0 ? (
          <Card>
            <EmptyState
              title="No questions yet"
              description="Build your question bank to create assessments"
              actionLabel="Add Question"
              onAction={() => setShowCreate(true)}
            />
          </Card>
        ) : (
          <Card className="overflow-hidden !p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app-border dark:border-dark-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Question</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Difficulty</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Marks</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default dark:divide-dk-border">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-app-bg-subtle dark:hover:bg-dark-surface transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{q.title}</p>
                      {q.tags && q.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {q.tags.map((tag, i) => <Badge key={i} variant="neutral">{tag}</Badge>)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4"><Badge variant="accent">{typeLabel(q.type)}</Badge></td>
                    <td className="px-6 py-4">{diffBadge(q.difficulty)}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{q.marks}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)}>
                        <span className="text-danger">Delete</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Create Modal */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Question" size="lg">
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter question title" />
            <Textarea label="Description / Question Body" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full question text..." />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                options={[
                  { value: "mcq_single", label: "MCQ (Single)" },
                  { value: "mcq_multi", label: "MCQ (Multiple)" },
                  { value: "true_false", label: "True/False" },
                  { value: "fill_blank", label: "Fill in the Blank" },
                  { value: "text_area", label: "Text Area" },
                  { value: "coding", label: "Coding" },
                ]}
              />
              <Select
                label="Difficulty"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                options={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Marks" type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: parseInt(e.target.value) || 1 })} />
              <Input label="Negative Marks" type="number" value={form.negativeMarks} onChange={(e) => setForm({ ...form, negativeMarks: parseInt(e.target.value) || 0 })} />
            </div>

            <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="javascript, react, frontend" />

            {/* MCQ Options */}
            {["mcq_single", "mcq_multi", "true_false"].includes(form.type) && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Options</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type={form.type === "mcq_multi" ? "checkbox" : "radio"}
                        name="correct"
                        checked={opt.isCorrect}
                        onChange={() => {
                          const newOpts = form.options.map((o, j) => ({
                            ...o,
                            isCorrect: form.type === "mcq_multi" ? (j === i ? !o.isCorrect : o.isCorrect) : j === i,
                          }));
                          setForm({ ...form, options: newOpts });
                        }}
                        className="accent-accent"
                      />
                      <Input
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...form.options];
                          newOpts[i] = { ...newOpts[i], text: e.target.value };
                          setForm({ ...form, options: newOpts });
                        }}
                        placeholder={`Option ${opt.id.toUpperCase()}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.type === "fill_blank" && (
              <Input label="Correct Answer" value={form.correctTextAnswer} onChange={(e) => setForm({ ...form, correctTextAnswer: e.target.value })} />
            )}

            {form.type === "coding" && (
              <div className="space-y-4">
                <Select
                  label="Language"
                  value={form.codeLanguage}
                  onChange={(e) => setForm({ ...form, codeLanguage: e.target.value })}
                  options={[
                    { value: "javascript", label: "JavaScript" },
                    { value: "python", label: "Python" },
                    { value: "java", label: "Java" },
                    { value: "cpp", label: "C++" },
                    { value: "typescript", label: "TypeScript" },
                  ]}
                />
                <Textarea label="Starter Code" value={form.starterCode} onChange={(e) => setForm({ ...form, starterCode: e.target.value })} placeholder="// Starter code here..." />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-app-border dark:border-dark-border">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!form.title}>Create Question</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
