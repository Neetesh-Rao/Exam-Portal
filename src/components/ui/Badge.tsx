"use client";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "accent";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-dark-text2",
  success: "bg-success-subtle text-success dark:bg-success/10 dark:text-green-400",
  warning: "bg-warn-subtle text-warn dark:bg-warn/10 dark:text-yellow-400",
  danger: "bg-danger-subtle text-danger dark:bg-danger/10 dark:text-red-400",
  accent: "bg-accent-subtle text-accent dark:bg-accent/10 dark:text-indigo-400",
};

export default function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
