"use client";

export default function Card({
  children,
  className = "",
  hover = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl shadow-premium p-6 ${
        hover ? "hover:border-[var(--border-color-strong)] hover:shadow-premium-md transition-all duration-200 cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
