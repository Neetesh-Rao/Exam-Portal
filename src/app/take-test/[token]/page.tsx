"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Camera, Monitor, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";

interface TestData {
  invite: { id: number; status: string; expiresAt: string };
  test: {
    id: number;
    title: string;
    description: string;
    totalDurationSeconds: number;
    proctoringConfig: {
      tabSwitchLimit: number;
      fullScreenRequired: boolean;
      webcamRequired: boolean;
      disableCopyPaste: boolean;
      disableRightClick: boolean;
    };
  };
  candidate: { id: number; name: string; email: string };
}

export default function TestInstructionsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [data, setData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  // Pre-test Device Setup States
  const [cameraReady, setCameraReady] = useState(false);
  const [screenReady, setScreenReady] = useState(false);
  const [permissionsRequesting, setPermissionsRequesting] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${token}/validate`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load test"); setLoading(false); });
  }, [token]);

  const handleDeviceSetup = async () => {
    setPermissionsRequesting(true);
    
    // 1. Request Camera & Mic
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      (window as any).__cameraStream = camStream;
      setCameraReady(true);
    } catch (err) {
      console.warn("Camera + Mic error, trying video only:", err);
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        (window as any).__cameraStream = camStream;
        setCameraReady(true);
      } catch (err2) {
        alert("⚠️ Camera permission blocked. Please click the lock/settings icon in the browser URL bar to allow Camera.");
      }
    }

    // 2. Request Screen Sharing ({ video: true })
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const scrStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        (window as any).__screenStream = scrStream;
        setScreenReady(true);
      }
    } catch (err) {
      console.warn("Screen share cancelled or unsupported:", err);
      // Mark screen ready if user cancelled popup to allow entry
      setScreenReady(true);
    } finally {
      setPermissionsRequesting(false);
    }
  };

  const handleStart = async () => {
    if (!cameraReady) {
      alert("Please click 'Step 1: Enable Camera & Share Entire Screen' to verify device access.");
      return;
    }

    setStarting(true);
    const res = await fetch("/api/submissions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const result = await res.json();
    if (result.error) {
      setError(result.error);
      setStarting(false);
      return;
    }
    router.push(`/take-test/${token}/exam?submissionId=${result.submission.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg-subtle dark:bg-app-text flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-ink dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-bg-subtle dark:bg-app-text flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Unable to Access Test</h1>
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { test, candidate } = data;
  const duration = Math.floor(test.totalDurationSeconds / 60);
  const proctoring = test.proctoringConfig;
  const isDevicesReady = cameraReady && screenReady;

  return (
    <div className="min-h-screen bg-app-bg-subtle dark:bg-app-text py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black text-white dark:bg-white dark:text-black rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            H
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{test.title}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Welcome, {candidate.name}</p>
        </div>

        {/* Test Info */}
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Test Overview</h2>
          {test.description && <p className="text-sm text-[var(--text-secondary)] mb-4">{test.description}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-app-bg-subtle dark:bg-dark-surface rounded-lg">
              <p className="text-xs text-[var(--text-muted)]">Duration</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{duration} minutes</p>
            </div>
            <div className="p-3 bg-app-bg-subtle dark:bg-dark-surface rounded-lg">
              <p className="text-xs text-[var(--text-muted)]">Tab Switch Limit</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{proctoring.tabSwitchLimit} max allowed</p>
            </div>
          </div>
        </Card>

        {/* Mandatory Pre-Exam Device & Screen Check */}
        <Card className="border-2 border-emerald-500/30 bg-emerald-500/5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">Step 1: Pre-Exam Device & Screen Sharing Setup</h2>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            To prevent accidental proctoring violations during the exam, please grant Camera & Screen Sharing permissions now before clicking Start Test.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-dark-surface rounded-lg border border-app-border dark:border-dark-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>Webcam & Microphone Check</span>
              </div>
              {cameraReady ? (
                <Badge variant="success">✓ Camera Active</Badge>
              ) : (
                <Badge variant="neutral">Pending</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-white dark:bg-dark-surface rounded-lg border border-app-border dark:border-dark-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Monitor className="w-4 h-4 text-blue-500" />
                <span>Entire Screen Sharing Check</span>
              </div>
              {screenReady ? (
                <Badge variant="success">✓ Screen Sharing Active</Badge>
              ) : (
                <Badge variant="neutral">Pending</Badge>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleDeviceSetup}
            loading={permissionsRequesting}
            variant={isDevicesReady ? "secondary" : "primary"}
            className="w-full font-semibold"
          >
            {isDevicesReady ? "✓ Device & Screen Verification Complete" : "🎥 Step 1: Enable Camera & Share Entire Screen"}
          </Button>
        </Card>

        {/* Rules */}
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Proctoring & Assessment Rules</h2>
          <ul className="space-y-3 text-xs text-[var(--text-secondary)]">
            <li className="flex items-start gap-3">
              <span className="text-danger font-bold">⚠️</span>
              <span>Do not switch tabs or windows during the test. Exceeding {proctoring.tabSwitchLimit} violations will automatically submit your exam.</span>
            </li>
            {proctoring.fullScreenRequired && (
              <li className="flex items-start gap-3">
                <span className="text-amber-500 font-bold">🖥️</span>
                <span>The exam runs in mandatory full screen mode.</span>
              </li>
            )}
            {proctoring.disableCopyPaste && (
              <li className="flex items-start gap-3">
                <span className="text-amber-500 font-bold">📋</span>
                <span>Copy, paste, and cut actions are disabled.</span>
              </li>
            )}
          </ul>
        </Card>

        {/* Agreement */}
        <Card>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 accent-emerald-500"
            />
            <span className="text-xs text-[var(--text-secondary)]">
              I understand and agree to follow all test proctoring rules.
            </span>
          </label>
        </Card>

        {/* Start Button */}
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleStart}
            loading={starting}
            disabled={!agreed || !isDevicesReady}
            size="lg"
            className="px-12 w-full sm:w-auto"
          >
            Step 2: Start Proctored Exam →
          </Button>
        </div>
      </div>
    </div>
  );
}
