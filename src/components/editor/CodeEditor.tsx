"use client";

import React, { useState } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  disablePaste?: boolean;
  onPasteAttempt?: () => void;
  readOnly?: boolean;
  height?: string;
}

export default function CodeEditor({
  value,
  onChange,
  language = "javascript",
  disablePaste = false,
  onPasteAttempt,
  readOnly = false,
  height = "350px",
}: CodeEditorProps) {
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleEditorChange = (val: string | undefined) => {
    onChange(val || "");
  };

  const handleMount = (editor: any, monaco: any) => {
    // Intercept paste events if paste is disabled
    editor.onKeyDown((e: any) => {
      // KeyCode 87 corresponds to 'V' in Monaco
      if (disablePaste && (e.ctrlKey || e.metaKey) && e.keyCode === 87) {
        e.preventDefault();
        e.stopPropagation();
        if (onPasteAttempt) onPasteAttempt();
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2500);
      }
    });
  };

  return (
    <div className="relative border border-neutral-300 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-950 font-mono text-sm shadow-sm">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center gap-2 font-mono uppercase tracking-wider font-semibold">
          <span className="w-2 h-2 rounded-full bg-neutral-800 dark:bg-neutral-200 inline-block"></span>
          <span>{language} Editor</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {disablePaste && (
            <span className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium">
              Paste Disabled
            </span>
          )}
          <span className="text-neutral-400 dark:text-neutral-500">
            {value.length} chars | {value.split("\n").length} lines
          </span>
        </div>
      </div>

      {/* Paste Notification Banner */}
      {copiedNotification && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg animate-bounce">
          ⚠️ Copy-pasting is disabled for this coding assessment
        </div>
      )}

      {/* Monaco Editor Component */}
      <Editor
        height={height}
        language={language.toLowerCase()}
        value={value}
        onChange={handleEditorChange}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          readOnly: readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
          smoothScrolling: true,
          cursorBlinking: "smooth",
        }}
      />
    </div>
  );
}
