"use client";

import { useEffect, useRef } from "react";

interface OutputConsoleProps {
  output: string[];
  isCompiling?: boolean;
}

export default function OutputConsole({ output, isCompiling }: OutputConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        height: "100%", 
        width: "100%", 
        background: "var(--surface-container-lowest)", 
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        overflow: "auto",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--body-sm)",
      }}
    >
      {output.length === 0 ? (
        <div style={{ color: "var(--outline)", textAlign: "center", paddingTop: "var(--space-8)" }}>
          {isCompiling ? "Compiling..." : "Output will appear here"}
        </div>
      ) : (
        output.map((line, index) => (
          <div 
            key={index}
            style={{ 
              color: line.includes("error") || line.includes("Error") 
                ? "var(--error)" 
                : line.includes("warning") || line.includes("Warning")
                  ? "var(--warning)"
                  : "var(--on-surface)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.5,
            }}
          >
            {line}
          </div>
        ))
      )}
      {isCompiling && (
        <div style={{ color: "var(--primary)", marginTop: "var(--space-2)" }}>
          ⟳ Compiling...
        </div>
      )}
    </div>
  );
}
