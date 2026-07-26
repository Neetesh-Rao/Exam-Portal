"use client";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { ToastProvider } from "@/components/ui/Toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-app-bg-subtle dark:bg-dark-bg">
        <AdminSidebar />
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
