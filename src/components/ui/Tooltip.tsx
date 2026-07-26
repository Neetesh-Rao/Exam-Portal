"use client";
import { useState, ReactNode } from "react";

export default function Tooltip({
  children,
  content,
}: {
  children: ReactNode;
  content: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--text-primary)] text-[var(--bg-color)] text-xs rounded whitespace-nowrap z-50">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink dark:border-t-white" />
        </div>
      )}
    </div>
  );
}
