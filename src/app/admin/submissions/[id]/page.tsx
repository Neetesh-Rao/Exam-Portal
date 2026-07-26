"use client";

import { useEffect, useState, use } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ShieldAlert, Video, Award, Clock, CheckCircle2, User, Play, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import CodeEditor from "@/components/editor/CodeEditor";

interface Question {
  id: string;
  title: string;
  description: string;
  type: string;
  marks: number;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctTextAnswer: string | null;
}

interface RecordingSnapshot {
  timestamp: string;
  imageUrl: string;
  event?: string;
}

interface SubmissionData {
  submission: {
    id: string;
    status: string;
    autoScore: number;
    manualScore: number | null;
    finalScore: number;
    totalMarks: number;
    answers: { questionId: string; answerText?: string; selectedOptionIds?: string[]; codeAnswer?: string; isMarkedForReview?: boolean }[];
    recordingSnapshots?: RecordingSnapshot[];
    startedAt: string;
    submittedAt: string;
  };
  candidate: { id: string; name: string; email: string };
  test: { id: string; title: string };
  questions: Question[];
  violations: { id: string; type: string; createdAt: string }[];
}

export default function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualScore, setManualScore] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [activeSnapshotIdx, setActiveSnapshotIdx] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);

  useEffect(() => {
    fetch(`/api/submissions/${id}`).then((r) => r.json()).then((d) => {
      setData(d);
      setManualScore(d.submission?.manualScore || 0);
      setLoading(false);
    });
  }, [id]);

  // Video Playback Animation Timer
  useEffect(() => {
    if (!isPlayingVideo) return;

    const interval = setInterval(() => {
      setActiveSnapshotIdx((prevIdx) => {
        const snapshotsCount = data?.submission?.recordingSnapshots?.length || 0;
        if (snapshotsCount === 0) return 0;
        if (prevIdx >= snapshotsCount - 1) {
          setIsPlayingVideo(false);
          return prevIdx;
        }
        return prevIdx + 1;
      });
    }, 600); // 600ms per frame video animation

    return () => clearInterval(interval);
  }, [isPlayingVideo, data]);

  const handleGrade = async () => {
    setSaving(true);
    await fetch(`/api/submissions/${id}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manualScore,
      }),
    });
    setSaving(false);
    window.location.reload();
  };

  if (loading) return (
    <div>
      <AdminHeader title="Loading submission details..." />
      <div className="p-8 max-w-5xl mx-auto"><CardSkeleton /></div>
    </div>
  );

  if (!data?.submission) return (
    <div>
      <AdminHeader title="Submission Not Found" />
      <div className="p-8 text-center text-[var(--text-muted)]">Submission not found.</div>
    </div>
  );

  const { submission, candidate, test, questions = [], violations = [] } = data;
  const snapshots = submission?.recordingSnapshots || [];
  const currentSnapshot = snapshots[activeSnapshotIdx];

  return (
    <div>
      <AdminHeader title={`Submission Review`} subtitle={`${candidate?.name || "Candidate"} • ${test?.title || "Assessment"}`} />
      
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        {/* Navigation */}
        <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Submissions List
        </Link>

        {/* Top Summary Header */}
        <Card className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{candidate?.name || "Candidate"}</h2>
              <Badge variant={submission.status === "graded" ? "neutral" : "accent"}>{submission.status?.replace("_", " ") || "submitted"}</Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{candidate?.email} • Assessment: {test?.title}</p>
          </div>

          <div className="flex items-center gap-6 bg-app-bg-subtle dark:bg-dark-surface p-4 rounded-xl border border-app-border dark:border-dark-border">
            <div className="text-center">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Total Score</p>
              <p className="text-2xl font-extrabold text-[var(--text-primary)]">{submission.finalScore ?? submission.autoScore ?? 0}</p>
            </div>
            <div className="w-px h-8 bg-app-border dark:bg-dark-border"></div>
            <div className="text-center">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Violations</p>
              <p className={`text-2xl font-bold ${violations?.length > 0 ? "text-danger" : "text-[var(--text-primary)]"}`}>
                {violations?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Video Recordings Section (Camera & Screen Recording) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camera Video Player */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-500" />
                Camera & Audio Recording Stream
              </h3>
              <Badge variant="neutral">Webcam Feed</Badge>
            </div>
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-neutral-800 flex items-center justify-center">
              {submission.videoRecordingUrl ? (
                <video controls preload="auto" playsInline className="w-full h-full object-cover">
                  <source src={submission.videoRecordingUrl} type="video/mp4" />
                  <source src={submission.videoRecordingUrl} type="video/webm" />
                </video>
              ) : (
                <div className="text-center p-6 text-neutral-400 text-xs">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                  <p>No camera video stream recorded for this submission.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Screen Recording Video Player */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-500" />
                Candidate Screen & Activity Video
              </h3>
              <Badge variant="neutral">Screen Capture</Badge>
            </div>
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-neutral-800 flex items-center justify-center">
              {(submission.screenRecordingUrl || submission.videoRecordingUrl) ? (
                <video controls preload="auto" playsInline className="w-full h-full object-contain">
                  <source src={submission.screenRecordingUrl || submission.videoRecordingUrl} type="video/mp4" />
                  <source src={submission.screenRecordingUrl || submission.videoRecordingUrl} type="video/webm" />
                </video>
              ) : (
                <div className="text-center p-6 text-neutral-400 text-xs">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-400" />
                  <p>No screen recording stream uploaded for this submission.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Live Video / Screen Proctoring Snapshots Recording Player */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-app-border dark:border-dark-border pb-3">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Video className="w-4 h-4 text-accent" />
              Proctoring Video Stream Timeline & Playback
            </h3>
            <span className="text-xs text-[var(--text-muted)] font-semibold">{snapshots.length} Recording Frames</span>
          </div>

          {snapshots.length === 0 ? (
            <div className="p-8 text-center bg-app-bg-subtle dark:bg-dark-surface rounded-xl border border-app-border dark:border-dark-border text-xs text-[var(--text-muted)]">
              No webcam snapshots recorded for this test session yet. Camera recording captures frames periodically during exam execution.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Snapshot Frame Display */}
              <div className="md:col-span-2 space-y-3">
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-neutral-800 flex items-center justify-center">
                  {currentSnapshot?.imageUrl?.startsWith("data:video") ? (
                    <video
                      src={currentSnapshot.imageUrl}
                      controls
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={currentSnapshot?.imageUrl}
                      alt="Proctoring Frame"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-mono font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{currentSnapshot?.imageUrl?.startsWith("data:video") ? "Video Stream Chunk" : "Camera Frame"} {activeSnapshotIdx + 1} / {snapshots.length}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur text-neutral-300 text-xs px-3 py-1.5 rounded-lg flex items-center justify-between">
                    <span>Captured: {currentSnapshot ? new Date(currentSnapshot.timestamp).toLocaleTimeString() : "—"}</span>
                    <span className="capitalize font-medium text-emerald-400">{currentSnapshot?.event || "Camera Snapshot"}</span>
                  </div>
                </div>

                {/* Playback Navigation & Video Control Bar */}
                <div className="space-y-2 bg-app-bg-subtle dark:bg-dark-surface p-3 rounded-xl border border-app-border dark:border-dark-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                        className="bg-black text-white dark:bg-white dark:text-black font-semibold text-xs px-4"
                      >
                        {isPlayingVideo ? "⏸ Pause Video" : "▶ Play Video Recording"}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={activeSnapshotIdx === 0}
                        onClick={() => {
                          setIsPlayingVideo(false);
                          setActiveSnapshotIdx(Math.max(0, activeSnapshotIdx - 1));
                        }}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={activeSnapshotIdx === snapshots.length - 1}
                        onClick={() => {
                          setIsPlayingVideo(false);
                          setActiveSnapshotIdx(Math.min(snapshots.length - 1, activeSnapshotIdx + 1));
                        }}
                      >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    <span className="text-xs text-[var(--text-muted)] font-mono font-semibold">
                      Frame {activeSnapshotIdx + 1} of {snapshots.length}
                    </span>
                  </div>

                  {/* Interactive Video Playback Slider */}
                  {snapshots.length > 1 && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="range"
                        min={0}
                        max={snapshots.length - 1}
                        value={activeSnapshotIdx}
                        onChange={(e) => {
                          setIsPlayingVideo(false);
                          setActiveSnapshotIdx(Number(e.target.value));
                        }}
                        className="w-full accent-black dark:accent-white cursor-pointer h-1.5 bg-neutral-300 dark:bg-neutral-800 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Snapshot Thumbnails Reel */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Stream Timeline Reel</p>
                <div className="grid grid-cols-2 gap-2">
                  {snapshots.map((snap, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSnapshotIdx(idx)}
                      className={`relative rounded-lg overflow-hidden border aspect-video transition-all cursor-pointer ${
                        activeSnapshotIdx === idx ? "border-accent ring-2 ring-accent/30" : "border-app-border dark:border-dark-border opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={snap.imageUrl} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1 rounded font-mono">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Proctoring Violation Log Timeline */}
        {violations && violations.length > 0 && (
          <Card className="space-y-3">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-danger" />
              Itemized Proctoring Violation Events
            </h3>
            <div className="space-y-2">
              {violations.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-xs">
                  <Badge variant="danger">{v.type?.replace(/_/g, " ").toUpperCase()}</Badge>
                  <span className="text-[var(--text-muted)] font-mono">{new Date(v.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Candidate Question Answers */}
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Submitted Question Responses</h3>
          {(!questions || questions.length === 0) ? (
            <p className="text-xs text-[var(--text-muted)] italic">No questions found for this assessment.</p>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => {
                const answer = submission.answers?.find((a) => a.questionId?.toString() === q.id?.toString());

                return (
                  <div key={q.id || idx} className="p-5 border border-app-border dark:border-dark-border rounded-xl space-y-3 bg-app-bg-subtle/50 dark:bg-dark-surface/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Q{idx + 1}. {q.title}</p>
                        {q.description && <p className="text-xs text-[var(--text-muted)] mt-1">{q.description}</p>}
                      </div>
                      <Badge variant="neutral">{q.marks} Marks</Badge>
                    </div>

                    {/* MCQ Responses */}
                    {["mcq_single", "mcq_multi", "true_false"].includes(q.type) && q.options && (
                      <div className="space-y-2 pt-2">
                        {q.options.map((opt) => {
                          const isSelected = answer?.selectedOptionIds?.includes(opt.id);
                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
                                opt.isCorrect
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                  : isSelected
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                                  : "bg-white dark:bg-dark-surface border-app-border dark:border-dark-border text-[var(--text-secondary)]"
                              }`}
                            >
                              <span>{opt.text}</span>
                              <span>{opt.isCorrect ? "✓ Correct Answer" : isSelected ? "Candidate Selected" : ""}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Text / Subjective Answers */}
                    {["text_area", "fill_blank"].includes(q.type) && (
                      <div className="p-4 bg-white dark:bg-dark-surface rounded-lg border border-app-border dark:border-dark-border text-xs text-[var(--text-primary)] whitespace-pre-wrap">
                        {answer?.answerText || <em className="text-[var(--text-muted)]">No text response submitted.</em>}
                      </div>
                    )}

                    {/* Monaco Code Editor Answer Snapshot */}
                    {q.type === "coding" && (
                      <div className="pt-2">
                        <CodeEditor
                          value={answer?.codeAnswer || "// No code submitted"}
                          onChange={() => {}}
                          language="javascript"
                          readOnly={true}
                          height="260px"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Manual Scoring Section */}
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Manual Marks & Evaluation</h3>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <Input
              label="Additional Manual Marks"
              type="number"
              value={manualScore}
              onChange={(e) => setManualScore(Number(e.target.value) || 0)}
              className="max-w-xs"
            />
            <Button onClick={handleGrade} loading={saving}>
              Save Evaluation & Finalize Marks
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
