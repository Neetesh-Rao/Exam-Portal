"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function TestSubmittedPage() {
  return (
    <div className="min-h-screen bg-app-bg-subtle dark:bg-app-text flex items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <div className="w-16 h-16 bg-success-subtle dark:bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Test Submitted!</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Your test has been successfully submitted. The results will be shared with you soon.
        </p>
        <div className="p-4 bg-app-bg-subtle dark:bg-dark-surface rounded-lg mb-6">
          <p className="text-xs text-[var(--text-muted)] mb-1">What happens next?</p>
          <ul className="text-sm text-[var(--text-secondary)] text-left space-y-1">
            <li>• Your answers are being evaluated</li>
            <li>• You will receive an email with your results</li>
            <li>• The hiring team will review your performance</li>
          </ul>
        </div>
        <Button variant="secondary" onClick={() => window.close()}>Close Window</Button>
      </Card>
    </div>
  );
}
