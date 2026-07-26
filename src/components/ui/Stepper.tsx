"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepperProps {
  steps: { label: string }[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--color-border)] rounded-full" />
        
        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isActive = currentStep === index;
          
          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted || isActive ? "var(--color-accent)" : "var(--surface-color)",
                  borderColor: isCompleted || isActive ? "var(--color-accent)" : "var(--color-border)",
                  color: isCompleted || isActive ? "#fff" : "var(--text-muted)",
                }}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-sm`}
              >
                {isCompleted ? <Check size={16} /> : index + 1}
              </motion.div>
              <span className={`text-xs font-medium absolute -bottom-6 w-max text-center ${isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
        
        {/* Progress Fill */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--color-accent)] rounded-full z-0"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ ease: "easeInOut", duration: 0.3 }}
        />
      </div>
      <div className="h-8" /> {/* Spacer for labels */}
    </div>
  );
}
