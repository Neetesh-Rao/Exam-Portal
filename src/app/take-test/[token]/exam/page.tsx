"use client";
import { useEffect, useState, useCallback, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import CodeEditor from "@/components/editor/CodeEditor";

interface Question {
  id: number;
  title: string;
  description: string;
  type: string;
  marks: number;
  options: { id: string; text: string; isCorrect: boolean }[];
  codeConfig: { language: string; starterCode: string; disablePaste: boolean } | null;
}

interface Answer {
  questionId: number;
  answerText?: string;
  selectedOptionIds?: string[];
  codeAnswer?: string;
  isMarkedForReview?: boolean;
}

export default function ExamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [totalTime, setTotalTime] = useState(3600);
  const [violations, setViolations] = useState(0);
  const [maxViolations, setMaxViolations] = useState(3);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testEnded, setTestEnded] = useState(false);
  const [proctoringConfig, setProctoringConfig] = useState<{ disableCopyPaste: boolean; disableRightClick: boolean; fullScreenRequired: boolean }>({
    disableCopyPaste: true,
    disableRightClick: true,
    fullScreenRequired: true,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraBlobsRef = useRef<Blob[]>([]);
  const screenBlobsRef = useRef<Blob[]>([]);
  const [cameraActive, setCameraActive] = useState(false);

  // Load test data
  useEffect(() => {
    fetch("/api/submissions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then((r) => r.json()).then((d) => {
      if (d.questions) setQuestions(d.questions);
      if (d.submission?.answers) setAnswers(d.submission.answers);
      if (d.test?.totalDurationSeconds) {
        setTotalTime(d.test.totalDurationSeconds);
        // Calculate remaining time based on start
        const started = new Date(d.submission?.startedAt || Date.now()).getTime();
        const elapsed = Math.floor((Date.now() - started) / 1000);
        setTimeLeft(Math.max(0, d.test.totalDurationSeconds - elapsed));
      }
      if (d.test?.proctoringConfig) {
        setProctoringConfig(d.test.proctoringConfig);
        setMaxViolations(d.test.proctoringConfig.tabSwitchLimit || 3);
      }
      setLoading(false);
    });
  }, [token]);

  // Timer
  useEffect(() => {
    if (loading || testEnded) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, testEnded]);

  const [isGracePeriod, setIsGracePeriod] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsGracePeriod(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Tab switch detection
  useEffect(() => {
    if (loading || testEnded || isGracePeriod) return;

    const handleVisibility = () => {
      if (document.hidden) {
        logViolation("tab_switch");
      }
    };

    const handleBlur = () => {
      logViolation("tab_switch");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [loading, testEnded, isGracePeriod, violations]);

  // Copy/paste/right-click blocking
  useEffect(() => {
    if (loading || testEnded) return;

    const handleCopy = (e: ClipboardEvent) => {
      if (proctoringConfig.disableCopyPaste) {
        e.preventDefault();
        logViolation("copy_attempt");
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (proctoringConfig.disableCopyPaste) {
        e.preventDefault();
        logViolation("paste_attempt");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (proctoringConfig.disableRightClick) {
        e.preventDefault();
        logViolation("right_click");
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [loading, testEnded, proctoringConfig]);

  // Fullscreen
  useEffect(() => {
    if (loading || testEnded || !proctoringConfig.fullScreenRequired) return;

    const enterFullscreen = () => {
      document.documentElement.requestFullscreen?.().catch(() => {});
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && proctoringConfig.fullScreenRequired) {
        logViolation("fullscreen_exit");
        enterFullscreen();
      }
    };

    enterFullscreen();
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [loading, testEnded, proctoringConfig.fullScreenRequired]);

  // Webcam (Camera + Audio) & Live Screen Stream Capture
  useEffect(() => {
    if (loading || testEnded) return;

    let webcamStream: MediaStream | null = null;
    let screenStream: MediaStream | null = null;
    let webcamRecorder: MediaRecorder | null = null;
    let screenRecorder: MediaRecorder | null = null;

    const startProctoringStreams = async () => {
      try {
        // 1. Camera + Microphone Stream (Reuse pre-verified stream if available)
        if ((window as any).__cameraStream && (window as any).__cameraStream.active) {
          webcamStream = (window as any).__cameraStream;
        } else {
          webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = webcamStream;
          setCameraActive(true);
        }

        if (window.MediaRecorder && webcamStream) {
          webcamRecorder = new MediaRecorder(webcamStream);
          webcamRecorder.ondataavailable = (event: BlobEvent) => {
            if (event.data && event.data.size > 0) {
              cameraBlobsRef.current.push(event.data);
            }
          };
          webcamRecorder.start(1000);
        }
      } catch (err) {
        console.warn("Webcam access error:", err);
      }

      try {
        // 2. Full Screen Recording Stream (Reuse pre-verified stream if available)
        if ((window as any).__screenStream && (window as any).__screenStream.active) {
          screenStream = (window as any).__screenStream;
        } else if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        }

        if (window.MediaRecorder && screenStream) {
          screenRecorder = new MediaRecorder(screenStream);
          screenRecorder.ondataavailable = (event: BlobEvent) => {
            if (event.data && event.data.size > 0) {
              screenBlobsRef.current.push(event.data);
            }
          };
          screenRecorder.start(1000);
        }
      } catch (err) {
        console.warn("Screen recording access denied:", err);
      }
    };

    startProctoringStreams();

    // Fallback periodic canvas snapshot every 10 seconds
    const captureInterval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || !submissionId) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL("image/jpeg", 0.5);

        fetch(`/api/submissions/${submissionId}/webcam-snapshot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, event: "proctoring_snapshot" }),
        }).catch(() => {});
      }
    }, 10000);

    return () => {
      clearInterval(captureInterval);
      if (webcamRecorder && webcamRecorder.state !== "inactive") webcamRecorder.stop();
      if (screenRecorder && screenRecorder.state !== "inactive") screenRecorder.stop();
      if (webcamStream) webcamStream.getTracks().forEach((track) => track.stop());
      if (screenStream) screenStream.getTracks().forEach((track) => track.stop());
    };
  }, [loading, testEnded, submissionId]);

  const logViolation = async (type: string) => {
    const newCount = violations + 1;
    setViolations(newCount);
    setShowWarning(true);

    await fetch(`/api/submissions/${submissionId}/violation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });

    if (newCount >= maxViolations) {
      handleAutoSubmit();
    }
  };

  const saveAnswer = useCallback(async (answer: Answer) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await fetch(`/api/submissions/${submissionId}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answer),
      });
    }, 500);
  }, [submissionId]);

  const updateAnswer = (update: Partial<Answer>) => {
    const q = questions[currentIdx];
    if (!q) return;

    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === q.id);
      const newAnswer = { ...existing, questionId: q.id, ...update };
      const newAnswers = existing
        ? prev.map((a) => (a.questionId === q.id ? newAnswer : a))
        : [...prev, newAnswer];
      saveAnswer(newAnswer);
      return newAnswers;
    });
  };

  const uploadRecordingsToCloudinary = async () => {
    try {
      if (!submissionId) return;

      const formData = new FormData();

      if (cameraBlobsRef.current.length > 0) {
        const cameraBlob = new Blob(cameraBlobsRef.current, { type: "video/webm" });
        formData.append("cameraVideo", cameraBlob, "camera_recording.webm");
      }

      if (screenBlobsRef.current.length > 0) {
        const screenBlob = new Blob(screenBlobsRef.current, { type: "video/webm" });
        formData.append("screenVideo", screenBlob, "screen_recording.webm");
      }

      if (cameraBlobsRef.current.length > 0 || screenBlobsRef.current.length > 0) {
        await fetch(`/api/submissions/${submissionId}/upload-full-recordings`, {
          method: "POST",
          body: formData,
        });
      }
    } catch (err) {
      console.warn("Cloudinary upload error on submission:", err);
    }
  };

  const handleAutoSubmit = async () => {
    setTestEnded(true);
    setSubmitting(true);

    await uploadRecordingsToCloudinary();

    await fetch(`/api/submissions/${submissionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoSubmitted: true }),
    });
    router.push(`/take-test/${token}/submitted`);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    await uploadRecordingsToCloudinary();

    await fetch(`/api/submissions/${submissionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoSubmitted: false }),
    });
    router.push(`/take-test/${token}/submitted`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-app-text flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-ink dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id);
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const isWarningTime = timeLeft < 120;

  return (
    <div className="min-h-screen bg-app-bg-subtle dark:bg-app-text flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-dark-surface border-r border-app-border dark:border-dark-border flex flex-col fixed left-0 top-0 h-screen">
        {/* Timer */}
        <div className="p-4 border-b border-app-border dark:border-dark-border">
          <p className="text-xs text-[var(--text-muted)] mb-1">Time Remaining</p>
          <p className={`text-3xl font-bold tracking-tight ${isWarningTime ? "text-danger" : "text-[var(--text-primary)]"}`}>
            {formatTime(timeLeft)}
          </p>
          <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${isWarningTime ? "bg-danger" : "bg-[var(--text-primary)]"}`}
              style={{ width: `${(timeLeft / totalTime) * 100}%` }}
            />
          </div>
        </div>

        {/* Violations */}
        <div className="p-4 border-b border-app-border dark:border-dark-border">
          <p className="text-xs text-[var(--text-muted)] mb-1">Violations</p>
          <p className={`text-lg font-bold ${violations > 0 ? "text-danger" : "text-[var(--text-primary)]"}`}>
            {violations} / {maxViolations}
          </p>
        </div>

        {/* Live Proctoring Webcam Feed Widget */}
        <div className="p-3 border-b border-app-border dark:border-dark-border bg-neutral-950 text-white">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Webcam Active
            </span>
            <span className="text-[10px] text-neutral-400">Proctored Session</span>
          </div>
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video border border-neutral-800 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {/* Question Palette */}
        <div className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs text-[var(--text-muted)] mb-3">Questions</p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const ans = answers.find((a) => a.questionId === q.id);
              const hasAnswer = ans?.selectedOptionIds?.length || ans?.answerText || ans?.codeAnswer;
              const isMarked = ans?.isMarkedForReview;
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-9 h-9 rounded-lg text-xs font-medium flex items-center justify-center border transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-[var(--text-primary)] text-[var(--bg-color)] border-transparent"
                      : isMarked
                      ? "bg-warn text-white border-transparent"
                      : hasAnswer
                      ? "bg-success text-white border-transparent"
                      : "bg-gray-100 dark:bg-dark-surface text-[var(--text-secondary)] border-app-border dark:border-dark-border"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-100 dark:bg-dark-surface border border-app-border dark:border-dark-border" /><span className="text-[var(--text-muted)]">Not visited</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-success" /><span className="text-[var(--text-muted)]">Answered</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-warn" /><span className="text-[var(--text-muted)]">Marked for review</span></div>
          </div>
        </div>

        {/* Submit */}
        <div className="p-4 border-t border-app-border dark:border-dark-border">
          <Button onClick={() => setShowConfirmSubmit(true)} className="w-full">Submit Test</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        {currentQuestion && (
          <div className="max-w-3xl mx-auto">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Question {currentIdx + 1} of {questions.length}</p>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">{currentQuestion.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{currentQuestion.marks} marks</Badge>
                <Badge variant="accent">{currentQuestion.type.replace(/_/g, " ")}</Badge>
              </div>
            </div>

            {/* Question Body */}
            {currentQuestion.description && (
              <div className="prose prose-sm dark:prose-invert max-w-none mb-6 text-[var(--text-secondary)]">
                <p>{currentQuestion.description}</p>
              </div>
            )}

            {/* Answer Area */}
            <div className="bg-white dark:bg-dark-surface border border-app-border dark:border-dark-border rounded-xl p-6">
              {/* MCQ */}
              {["mcq_single", "mcq_multi", "true_false"].includes(currentQuestion.type) && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((opt) => {
                    const isSelected = currentAnswer?.selectedOptionIds?.includes(opt.id);
                    const inputType = currentQuestion.type === "mcq_multi" ? "checkbox" : "radio";

                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-accent bg-accent-subtle dark:bg-accent/10"
                            : "border-app-border dark:border-dark-border hover:border-app-border-strong dark:hover:border-gray-700"
                        }`}
                      >
                        <input
                          type={inputType}
                          name="answer"
                          checked={isSelected}
                          onChange={() => {
                            if (currentQuestion.type === "mcq_multi") {
                              const current = currentAnswer?.selectedOptionIds || [];
                              const updated = isSelected ? current.filter((id) => id !== opt.id) : [...current, opt.id];
                              updateAnswer({ selectedOptionIds: updated });
                            } else {
                              updateAnswer({ selectedOptionIds: [opt.id] });
                            }
                          }}
                          className="accent-accent"
                        />
                        <span className="text-sm text-[var(--text-primary)]">{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Text Area */}
              {["text_area", "fill_blank"].includes(currentQuestion.type) && (
                <textarea
                  value={currentAnswer?.answerText || ""}
                  onChange={(e) => updateAnswer({ answerText: e.target.value })}
                  placeholder="Type your answer here..."
                  className="w-full h-40 p-4 bg-app-bg-subtle dark:bg-dark-surface border border-app-border dark:border-dark-border rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-accent resize-none"
                />
              )}

              {/* Coding */}
              {currentQuestion.type === "coding" && (
                <div>
                  <CodeEditor
                    value={currentAnswer?.codeAnswer || currentQuestion.codeConfig?.starterCode || ""}
                    onChange={(val) => updateAnswer({ codeAnswer: val })}
                    language={currentQuestion.codeConfig?.language || "javascript"}
                    disablePaste={currentQuestion.codeConfig?.disablePaste}
                    onPasteAttempt={() => logViolation("paste_attempt")}
                    height="380px"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
                  ← Previous
                </Button>
                <Button variant="secondary" onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))} disabled={currentIdx === questions.length - 1}>
                  Next →
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    const current = currentAnswer?.selectedOptionIds || [];
                    updateAnswer({ selectedOptionIds: [], answerText: "", codeAnswer: "" });
                  }}
                >
                  Clear Response
                </Button>
                <Button
                  variant={currentAnswer?.isMarkedForReview ? "secondary" : "ghost"}
                  onClick={() => updateAnswer({ isMarkedForReview: !currentAnswer?.isMarkedForReview })}
                >
                  {currentAnswer?.isMarkedForReview ? "✓ Marked" : "Mark for Review"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warning Modal */}
      <Modal open={showWarning} onClose={() => setShowWarning(false)} title="⚠️ Warning">
        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            A violation has been detected. Please stay on this tab and follow the test rules.
          </p>
          <p className="text-lg font-bold text-danger mb-4">
            Violations: {violations} / {maxViolations}
          </p>
          {violations >= maxViolations - 1 && (
            <p className="text-sm text-danger mb-4">
              One more violation will auto-submit your test!
            </p>
          )}
          <Button onClick={() => setShowWarning(false)}>I Understand</Button>
        </div>
      </Modal>

      {/* Submit Confirmation */}
      <Modal open={showConfirmSubmit} onClose={() => setShowConfirmSubmit(false)} title="Submit Test?">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Are you sure you want to submit? You cannot change your answers after submission.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div className="p-3 bg-success-subtle dark:bg-success/10 rounded-lg">
              <p className="text-lg font-bold text-success">{answers.filter((a) => a.selectedOptionIds?.length || a.answerText || a.codeAnswer).length}</p>
              <p className="text-xs text-[var(--text-muted)]">Answered</p>
            </div>
            <div className="p-3 bg-warn-subtle dark:bg-warn/10 rounded-lg">
              <p className="text-lg font-bold text-warn">{answers.filter((a) => a.isMarkedForReview).length}</p>
              <p className="text-xs text-[var(--text-muted)]">Marked</p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-dark-surface rounded-lg">
              <p className="text-lg font-bold text-[var(--text-secondary)]">{questions.length - answers.filter((a) => a.selectedOptionIds?.length || a.answerText || a.codeAnswer).length}</p>
              <p className="text-xs text-[var(--text-muted)]">Unanswered</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowConfirmSubmit(false)}>Continue Test</Button>
            <Button onClick={handleSubmit} loading={submitting}>Submit Test</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
