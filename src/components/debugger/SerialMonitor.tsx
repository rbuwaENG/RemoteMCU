"use client";

import { useEffect, useRef, useState } from "react";

interface SerialMonitorProps {
  isConnected: boolean;
  onSend?: (data: string) => void;
}

export default function SerialMonitor({ isConnected, onSend }: SerialMonitorProps) {
  const [output, setOutput] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isConnected) {
      const mockData = [
        "RemoteMCU: Setup complete!",
        "LED ON",
        "LED OFF",
        "LED ON",
        "LED OFF",
      ];
      
      let i = 0;
      const interval = setInterval(() => {
        if (i < mockData.length) {
          setOutput(prev => [...prev, `${new Date().toLocaleTimeString()} > ${mockData[i]}`]);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  useEffect(() => {
    if (containerRef.current && isAutoScroll) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output, isAutoScroll]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && onSend) {
      onSend(input);
      setOutput(prev => [...prev, `${new Date().toLocaleTimeString()} < ${input}`]);
      setInput("");
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div className="flex flex-between" style={{ padding: "var(--space-3)", borderBottom: "1px solid var(--outline-variant)" }}>
        <div className="flex gap-3" style={{ alignItems: "center" }}>
          <span className={`status-dot ${isConnected ? "status-dot-online" : "status-dot-offline"}`}></span>
          <span style={{ fontSize: "var(--body-sm)" }}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setOutput([])}
          >
            Clear
          </button>
          <button 
            className={`btn btn-sm ${isAutoScroll ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setIsAutoScroll(!isAutoScroll)}
          >
            Auto-scroll
          </button>
        </div>
      </div>
      
      {/* Output */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          overflow: "auto", 
          padding: "var(--space-3)",
          background: "var(--surface-container-lowest)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--body-sm)",
        }}
      >
        {output.length === 0 ? (
          <div style={{ color: "var(--outline)", textAlign: "center", paddingTop: "var(--space-8)" }}>
            {isConnected ? "Waiting for data..." : "Connect to a device to see serial output"}
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} style={{ 
              color: line.includes(" >") ? "var(--primary)" : "var(--on-surface)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.6,
            }}>
              {line}
            </div>
          ))
        )}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: "var(--space-3)", borderTop: "1px solid var(--outline-variant)" }}>
        <div className="flex gap-2">
          <input
            type="text"
            className="input"
            placeholder="Send command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isConnected}
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!isConnected || !input.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
