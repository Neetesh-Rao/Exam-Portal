"use client";
import Link from "next/link";
import { ToastProvider } from "@/components/ui/Toast";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-app-bg-subtle dark:bg-app-text">
        <nav className="bg-white dark:bg-dark-surface border-b border-app-border dark:border-dark-border">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[var(--text-primary)] rounded-lg flex items-center justify-center">
                <span className="text-[var(--bg-color)] font-bold text-sm">H</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">HireDesk</span>
            </Link>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="text-sm text-[var(--text-muted)] hover:text-danger cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </nav>
        <main>{children}</main>
      </div>
    </ToastProvider>
  );
}
