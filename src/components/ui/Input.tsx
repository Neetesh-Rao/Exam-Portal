"use client";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-10 px-3 text-base bg-white dark:bg-dark-surface border rounded-lg transition-colors duration-150 placeholder:text-[var(--text-muted)] text-[var(--text-primary)] ${
            error
              ? "border-danger focus:ring-2 focus:ring-danger/20"
              : "border-[var(--border-color)] focus:border-accent focus:ring-2 focus:ring-accent/20"
          } outline-none ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {helperText && !error && <p className="text-xs text-[var(--text-muted)]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
