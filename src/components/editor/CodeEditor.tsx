"use client";

import { useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  /** Optional — receive the raw Monaco editor instance (for setting markers, jumping to lines, etc.) */
  onMount?: (editor: Parameters<OnMount>[0]) => void;
}

const DEFAULT_CODE = `// RemoteMCU - Arduino Sketch
// Write your code below

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  
  Serial.println("RemoteMCU: Setup complete!");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.println("LED ON");
  delay(1000);
  
  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("LED OFF");
  delay(1000);
}
`;

export default function CodeEditor({ 
  value = DEFAULT_CODE, 
  onChange, 
  language = "cpp",
  readOnly = false,
  onMount,
}: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    // Expose the editor instance to the parent (for marker setting, jump-to-line, etc.)
    onMount?.(editor);

    monacoInstance.editor.defineTheme("remotemcu-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A737D" },
        { token: "keyword", foreground: "B4C5FF" },
        { token: "string", foreground: "4EDEA3" },
        { token: "number", foreground: "FFB689" },
        { token: "type", foreground: "DDB7FF" },
      ],
      colors: {
        "editor.background": "#0B1326",
        "editor.foreground": "#DAE2FD",
        "editor.lineHighlightBackground": "#171F33",
        "editor.selectionBackground": "#2563eb50",
        "editorCursor.foreground": "#B4C5FF",
        "editorLineNumber.foreground": "#434655",
        "editorLineNumber.activeForeground": "#B4C5FF",
      },
    });
    
    monacoInstance.editor.setTheme("remotemcu-dark");
    
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "on",
      lineNumbers: "on",
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
      padding: { top: 16 },
    });
  };

  const handleChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
        }}
        loading={
          <div className="flex flex-center" style={{ height: "100%", background: "var(--surface-container)" }}>
            <div className="skeleton" style={{ width: "200px", height: "40px" }}></div>
          </div>
        }
      />
    </div>
  );
}
