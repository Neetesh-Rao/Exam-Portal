"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";

interface ProctoringWrapperProps {
  children: React.ReactNode;
  config: {
    tabSwitchLimit: number;
    fullScreenRequired: boolean;
    disableCopyPaste: boolean;
    disableRightClick: boolean;
  };
  onViolation: (type: string, count: number) => void;
  onAutoSubmit: () => void;
}

export default function ProctoringWrapper({ children, config, onViolation, onAutoSubmit }: ProctoringWrapperProps) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // 1. Tab Switch / Window Blur Detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isLocked) {
        triggerTabSwitchViolation();
      }
    };

    const handleWindowBlur = () => {
      if (!isLocked) {
        triggerTabSwitchViolation();
      }
    };

    const triggerTabSwitchViolation = () => {
      setTabSwitchCount((prev) => {
        const next = prev + 1;
        onViolation("tab_switch", next);
        
        if (next >= config.tabSwitchLimit) {
          setIsLocked(true);
          onAutoSubmit();
        } else {
          setWarningMessage(`You have switched tabs or lost focus. (${next}/${config.tabSwitchLimit} allowed)`);
          setShowWarningModal(true);
        }
        return next;
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    // 2. Right Click Disable
    const handleContextMenu = (e: MouseEvent) => {
      if (config.disableRightClick) {
        e.preventDefault();
        onViolation("right_click", 1);
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);

    // 3. Copy Paste Block (for general page)
    const handleCopyPaste = (e: ClipboardEvent) => {
      if (config.disableCopyPaste) {
        e.preventDefault();
        onViolation("copy_paste", 1);
      }
    };
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
    };
  }, [config, isLocked, onViolation, onAutoSubmit]);

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-[var(--surface-color)] p-8 rounded-2xl border-2 border-[var(--color-danger)] shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-[var(--color-danger-subtle)] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Test Terminated</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Your test has been automatically submitted due to multiple proctoring policy violations.
          </p>
          <Button onClick={() => window.location.href = "/"} className="w-full">
            Return to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {children}

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: [0, -10, 10, -10, 10, 0] }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[var(--surface-color)] p-6 rounded-2xl shadow-2xl max-w-sm w-full border-2 border-[var(--color-warning)]"
            >
              <h3 className="text-xl font-bold text-[var(--color-warning)] mb-2 flex items-center gap-2">
                ⚠️ Warning
              </h3>
              <p className="text-[var(--text-primary)] font-medium mb-1">
                Policy Violation Detected
              </p>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                {warningMessage}
                <br /><br />
                Continuing this behavior will result in automatic test termination.
              </p>
              <Button onClick={() => setShowWarningModal(false)} className="w-full">
                I Understand
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
