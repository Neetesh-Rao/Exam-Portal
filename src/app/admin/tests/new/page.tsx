"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Stepper from "@/components/ui/Stepper";

interface Question {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  marks: number;
}

const steps = ["Basic Info", "Add Questions", "Proctoring", "Timing & Scoring", "Review"];

export default function NewTestPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [totalDuration, setTotalDuration] = useState(60);
  const [passPercentage, setPassPercentage] = useState(50);
  const [tabSwitchLimit, setTabSwitchLimit] = useState(3);
  const [fullScreenRequired, setFullScreenRequired] = useState(true);
  const [disableCopyPaste, setDisableCopyPaste] = useState(true);
  const [disableRightClick, setDisableRightClick] = useState(true);

  useEffect(() => {
    fetch("/api/questions").then((r) => r.json()).then((d) => setQuestions(d.questions || []));
  }, []);

  const toggleQuestion = (id: number) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((qid) => qid !== id) : [...prev, id]
    );
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    const res = await fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        sections: [{ title: "Section 1", questionIds: selectedQuestionIds, timeLimitSeconds: totalDuration * 60, randomizeQuestions: false }],
        totalDurationSeconds: totalDuration * 60,
        passPercentage,
        proctoringConfig: {
          tabSwitchLimit,
          fullScreenRequired,
          webcamRequired: false,
          disableCopyPaste,
          disableRightClick,
        },
      }),
    });
    const data = await res.json();

    if (publish && data.test?.id) {
      await fetch(`/api/tests/${data.test.id}/publish`, { method: "POST" });
    }

    setSaving(false);
    router.push("/admin/tests");
  };

  const diffBadge = (d: string) => {
    const map: Record<string, "success" | "warning" | "danger"> = { easy: "success", medium: "warning", hard: "danger" };
    return <Badge variant={map[d] || "neutral"}>{d}</Badge>;
  };

  return (
    <div>
      <AdminHeader title="Create Test" subtitle="Set up a new assessment" />
      <div className="p-8 max-w-4xl mx-auto">
        {/* Stepper */}
        <div className="mb-12">
          <Stepper 
            steps={steps.map(s => ({ label: s }))} 
            currentStep={step} 
          />
        </div>

        {/* Step Content */}
        {step === 0 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Basic Information</h3>
            <div className="space-y-4">
              <Input label="Test Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Frontend Developer Assessment" />
              <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this test evaluates..." />
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep(1)} disabled={!title}>Next →</Button>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Select Questions</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">{selectedQuestionIds.length} questions selected</p>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--text-muted)]">
                No questions in bank. <a href="/admin/questions" className="text-accent">Add questions first →</a>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {questions.map((q) => (
                  <label
                    key={q.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedQuestionIds.includes(q.id)
                        ? "border-accent bg-accent-subtle dark:bg-accent/10"
                        : "border-app-border dark:border-dark-border hover:border-app-border-strong"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedQuestionIds.includes(q.id)}
                      onChange={() => toggleQuestion(q.id)}
                      className="accent-accent"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{q.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="neutral">{q.type.replace("_", " ")}</Badge>
                        {diffBadge(q.difficulty)}
                        <span className="text-xs text-[var(--text-muted)]">{q.marks} marks</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
              <Button onClick={() => setStep(2)}>Next →</Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Proctoring Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-app-border dark:border-dark-border">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Full Screen Required</p>
                  <p className="text-xs text-[var(--text-muted)]">Force test to run in fullscreen mode</p>
                </div>
                <button onClick={() => setFullScreenRequired(!fullScreenRequired)} className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${fullScreenRequired ? "bg-[var(--text-primary)]" : "bg-gray-200 dark:bg-gray-800"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white dark:bg-app-text shadow-sm transition-transform ${fullScreenRequired ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-app-border dark:border-dark-border">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Disable Copy/Paste</p>
                  <p className="text-xs text-[var(--text-muted)]">Prevent copying and pasting in the test</p>
                </div>
                <button onClick={() => setDisableCopyPaste(!disableCopyPaste)} className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${disableCopyPaste ? "bg-[var(--text-primary)]" : "bg-gray-200 dark:bg-gray-800"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white dark:bg-app-text shadow-sm transition-transform ${disableCopyPaste ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-app-border dark:border-dark-border">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Disable Right Click</p>
                  <p className="text-xs text-[var(--text-muted)]">Prevent right-click context menu</p>
                </div>
                <button onClick={() => setDisableRightClick(!disableRightClick)} className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${disableRightClick ? "bg-[var(--text-primary)]" : "bg-gray-200 dark:bg-gray-800"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white dark:bg-app-text shadow-sm transition-transform ${disableRightClick ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <Input
                label="Tab Switch Limit"
                type="number"
                value={tabSwitchLimit}
                onChange={(e) => setTabSwitchLimit(parseInt(e.target.value) || 3)}
                helperText="Number of tab switches before auto-submit"
              />
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)}>Next →</Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Timing & Scoring</h3>
            <div className="space-y-4">
              <Input
                label="Total Duration (minutes)"
                type="number"
                value={totalDuration}
                onChange={(e) => setTotalDuration(parseInt(e.target.value) || 60)}
              />
              <Input
                label="Pass Percentage (%)"
                type="number"
                value={passPercentage}
                onChange={(e) => setPassPercentage(parseInt(e.target.value) || 50)}
              />
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
              <Button onClick={() => setStep(4)}>Next →</Button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Review & Publish</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Title</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Questions</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{selectedQuestionIds.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Duration</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{totalDuration} minutes</span>
              </div>
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Pass Percentage</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{passPercentage}%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-[var(--text-muted)]">Proctoring</span>
                <div className="flex gap-2">
                  {fullScreenRequired && <Badge variant="neutral">Fullscreen</Badge>}
                  {disableCopyPaste && <Badge variant="neutral">No Copy</Badge>}
                  {disableRightClick && <Badge variant="neutral">No Right-click</Badge>}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => handleSave(false)} loading={saving}>Save as Draft</Button>
                <Button onClick={() => handleSave(true)} loading={saving}>Publish Test</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
