"use client";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-primary)]">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3 py-3 text-base bg-white dark:bg-dark-surface border rounded-lg transition-colors duration-150 placeholder:text-[var(--text-muted)] text-[var(--text-primary)] ${
            error ? "border-danger" : "border-[var(--border-color)] focus:border-accent focus:ring-2 focus:ring-accent/20"
          } outline-none resize-none ${className}`}
          rows={4}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
