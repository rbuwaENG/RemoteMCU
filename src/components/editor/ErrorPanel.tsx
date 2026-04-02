"use client";

/**
 * ErrorPanel.tsx — Clickable compiler error and warning list.
 *
 * Displayed in the editor's bottom panel when a compile job returns errors.
 * Each row shows the severity icon, line/column, and message. Clicking a
 * row calls onJumpToLine() which makes Monaco scroll to and highlight that
 * exact position in the code editor.
 */

import { CompileError, CompileJob } from "@/lib/firestore/compileJobs";

interface ErrorPanelProps {
  job: CompileJob | null;
  /** Called when the user clicks an error row. Monaco should scroll here. */
  onJumpToLine: (line: number, column: number) => void;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ErrorRow({
  error,
  onJump,
}: {
  error: CompileError;
  onJump: (line: number, col: number) => void;
}) {
  const isError = error.type === "error";

  return (
    <button
      onClick={() => onJump(error.line, error.column)}
      className="w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group cursor-pointer border-0 bg-transparent"
      title={`Click to jump to line ${error.line}`}
    >
      {/* Severity icon */}
      <span
        className="shrink-0 mt-0.5 text-sm"
        aria-label={isError ? "Error" : "Warning"}
      >
        {isError ? "❌" : "⚠️"}
      </span>

      {/* Location */}
      <span
        className={`shrink-0 font-mono text-xs pt-0.5 w-24 ${
          isError ? "text-red-400" : "text-yellow-400"
        }`}
      >
        {error.line > 0
          ? `L${error.line}${error.column > 0 ? `:${error.column}` : ""}`
          : "–"}
      </span>

      {/* Message */}
      <span className="flex-1 font-mono text-xs text-[#DAE2FD] group-hover:text-white leading-relaxed break-words">
        {error.message}
      </span>

      {/* Jump arrow */}
      <span className="shrink-0 opacity-0 group-hover:opacity-50 text-xs text-[#DAE2FD] transition-opacity pt-0.5">
        ↗
      </span>
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-20 text-xs font-mono text-[#434655]">
      {label}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ErrorPanel({ job, onJumpToLine }: ErrorPanelProps) {
  if (!job) {
    return (
      <EmptyState label="Run a compilation to see errors and warnings here" />
    );
  }

  const errors = job.errors ?? [];
  const warnings = job.warnings ?? [];
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasAny = hasErrors || hasWarnings;

  if (!hasAny) {
    if (job.status === "flashed") {
      return (
        <div className="flex items-center justify-center h-20 gap-2 text-xs font-mono text-emerald-400">
          <span>✅</span>
          <span>
            No errors or warnings — flash complete
            {job.binarySize
              ? ` (${(job.binarySize / 1024).toFixed(1)} KB)`
              : ""}
            {job.durationMs ? ` in ${(job.durationMs / 1000).toFixed(1)}s` : ""}
          </span>
        </div>
      );
    }

    return (
      <EmptyState label="No problems found" />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 shrink-0">
        {hasErrors && (
          <span className="flex items-center gap-1.5 text-xs font-mono text-red-400">
            <span>❌</span>
            <span>
              {errors.length} error{errors.length !== 1 ? "s" : ""}
            </span>
          </span>
        )}
        {hasWarnings && (
          <span className="flex items-center gap-1.5 text-xs font-mono text-yellow-400">
            <span>⚠️</span>
            <span>
              {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
            </span>
          </span>
        )}
        {job.durationMs && (
          <span className="ml-auto text-[10px] font-mono text-[#434655]">
            Compiled in {(job.durationMs / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Scrollable error list */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {/* Errors first */}
        {errors.map((err, i) => (
          <ErrorRow
            key={`err-${i}`}
            error={err}
            onJump={onJumpToLine}
          />
        ))}

        {/* Warnings after errors */}
        {warnings.map((warn, i) => (
          <ErrorRow
            key={`warn-${i}`}
            error={warn}
            onJump={onJumpToLine}
          />
        ))}
      </div>
    </div>
  );
}
