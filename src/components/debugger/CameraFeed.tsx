"use client";

import { useEffect, useRef, useState } from "react";

interface CameraFeedProps {
  deviceId: string;
}

export default function CameraFeed({ deviceId }: CameraFeedProps) {
  const [isOn, setIsOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOn) return;
    
    setIsLoading(true);
    setError(null);
    
    let frameCount = 0;
    
    const simulateFrames = () => {
      if (!isOn) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.fillStyle = "#0B1326";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = "#222A3D";
      ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
      
      ctx.fillStyle = "#4EDEA3";
      ctx.font = "16px JetBrains Mono";
      ctx.fillText("Camera Feed", 20, 30);
      ctx.fillText(`Device: ${deviceId}`, 20, 50);
      
      const time = Date.now() / 1000;
      const y = Math.sin(time) * 50 + canvas.height / 2;
      const x = Math.cos(time * 0.5) * 50 + canvas.width / 2;
      
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fillStyle = "#B4C5FF";
      ctx.fill();
      
      ctx.fillStyle = "#DDb7FF";
      ctx.fillRect(canvas.width - 80, canvas.height - 40, 60, 20);
      ctx.fillStyle = "#FFF";
      ctx.font = "12px JetBrains Mono";
      ctx.fillText("LIVE", canvas.width - 70, canvas.height - 26);
      
      frameCount++;
      
      if (isOn) {
        requestAnimationFrame(simulateFrames);
      }
    };
    
    setTimeout(() => {
      setIsLoading(false);
      requestAnimationFrame(simulateFrames);
    }, 1000);
    
    return () => {
      setIsOn(false);
    };
  }, [isOn, deviceId]);

  const toggleCamera = () => {
    if (isOn) {
      setIsOn(false);
    } else {
      setError(null);
      setIsOn(true);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div className="flex flex-between" style={{ padding: "var(--space-3)", borderBottom: "1px solid var(--outline-variant)" }}>
        <div className="flex gap-3" style={{ alignItems: "center" }}>
          <span className={`status-dot ${isOn ? "status-dot-online" : "status-dot-offline"}`}></span>
          <span style={{ fontSize: "var(--body-sm)" }}>
            {isOn ? "Streaming" : "Off"}
          </span>
        </div>
        <button 
          className={`btn btn-sm ${isOn ? "btn-danger" : "btn-primary"}`}
          onClick={toggleCamera}
        >
          {isOn ? "Stop Stream" : "Start Stream"}
        </button>
      </div>
      
      {/* Video Feed */}
      <div style={{ 
        flex: 1, 
        background: "var(--surface-container-lowest)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}>
        {isLoading ? (
          <div className="flex flex-center" style={{ flexDirection: "column", gap: "var(--space-4)" }}>
            <div className="skeleton" style={{ width: "100px", height: "100px", borderRadius: "50%" }}></div>
            <span style={{ color: "var(--outline)" }}>Connecting to camera...</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", color: "var(--error)" }}>
            <div style={{ fontSize: "48px", marginBottom: "var(--space-4)" }}>⚠️</div>
            <p>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={toggleCamera} style={{ marginTop: "var(--space-4)" }}>
              Retry
            </button>
          </div>
        ) : !isOn ? (
          <div style={{ textAlign: "center", color: "var(--outline)" }}>
            <div style={{ fontSize: "48px", marginBottom: "var(--space-4)" }}>📷</div>
            <p>Click &quot;Start Stream&quot; to view the camera feed</p>
          </div>
        ) : null}
        
        <canvas 
          ref={canvasRef}
          width={640}
          height={480}
          style={{ 
            display: isOn && !isLoading ? "block" : "none",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        />
      </div>
    </div>
  );
}
