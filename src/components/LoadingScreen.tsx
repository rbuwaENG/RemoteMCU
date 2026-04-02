"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LoadingScreenProps {
  onComplete?: () => void;
  redirectTo?: string;
  duration?: number;
}

export default function LoadingScreen({ 
  onComplete, 
  redirectTo, 
  duration = 3000 
}: LoadingScreenProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing workspace...");
  const [logs, setLogs] = useState<{type: string; message: string}[]>([]);

  const addLog = (type: string, message: string) => {
    setLogs(prev => [...prev, { type, message }]);
  };

  useEffect(() => {
    const stages = [
      { progress: 20, status: "Verifying board communication [ESP32]...", log: { type: "OK", message: "Found device on COM4 (Silicon Labs CP210x)" } },
      { progress: 40, status: "Establishing secure connection...", log: { type: "OK", message: "Handshake successful @ 115200 baud" } },
      { progress: 60, status: "Loading sketch files...", log: { type: "LOAD", message: "sketch.ino... mapping memory segments" } },
      { progress: 80, status: "Compiling native modules...", log: { type: "OK", message: "Native module compilation complete" } },
      { progress: 100, status: "Initializing workspace...", log: { type: "OK", message: "All systems operational" } },
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setProgress(stages[currentStage].progress);
        setStatus(stages[currentStage].status);
        if (stages[currentStage].log) {
          addLog(stages[currentStage].log.type, stages[currentStage].log.message);
        }
        currentStage++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
        if (redirectTo) {
          setTimeout(() => router.push(redirectTo), 500);
        }
      }
    }, duration / stages.length);

    return () => clearInterval(interval);
  }, [duration, onComplete, redirectTo, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Subtle Background Layering */}
      <div className="fixed inset-0 grid-overlay opacity-[0.03] pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none"></div>

      {/* Main Loading Container */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-6">
        {/* Branding Header */}
        <div className="mb-16 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>memory</span>
            <h1 className="font-headline font-black text-2xl tracking-tighter text-primary">REMOTE MCU</h1>
          </div>
          <div className="h-[1px] w-12 bg-primary/30"></div>
        </div>

        {/* Central Technical Visual */}
        <div className="relative mb-12 flex items-center justify-center">
          {/* Tonal Layering for Depth */}
          <div className="absolute w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>

          {/* Technical Gear / Pulse Reference */}
          <div className="relative w-[140px] h-[140px] flex items-center justify-center border border-outline-variant/20 rounded-xl bg-surface-container-low/80 backdrop-blur-md">
            <img 
              alt="close-up technical diagram of a glowing circuit board" 
              className="w-24 h-24 object-contain opacity-80 mix-blend-screen"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDorg11JR0r83hU6EOib6hU6Gk_ztuE7DZlhNEH2CrAUrdO7od3joZEiJrU8eynSvK0UdakwDbOuJP8ZYqUlEwFHZGdeyYBOFXsXdD0C1jj2WytAre1uL0nSpY4zKqFwdTQBraVCpe5l91ScS-SKUQCK0-jbGGexJqHxjLFoJ9-0aC7ZnK8V4B1kY12x-Muo5xIoSm2CCloM213N62EkIK8BFTVsofO15q-YISW-xY7Xa691636-zyfi0PG8S85ioJTdBKTTEBobCzp"
            />
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary"></div>
          </div>
        </div>

        {/* Progress Interaction Area */}
        <div className="flex flex-col items-center w-full max-w-[400px]">
          <div className="flex justify-between w-full mb-3">
            <span className="font-headline font-semibold text-primary text-[14px] uppercase tracking-widest">{status}</span>
            <span className="font-mono text-primary text-[14px]">{progress}%</span>
          </div>

          {/* Progress Bar Shell */}
          <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary-container shadow-[0_0_8px_rgba(103,215,221,0.5)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">developer_board</span>
            <p className="font-mono text-on-surface-variant text-[12px] uppercase tracking-wider">{status}</p>
          </div>
        </div>
      </main>

      {/* Footer Terminal Logs */}
      <footer className="relative z-10 w-full p-8 flex justify-center">
        <div className="w-full max-w-2xl bg-surface-container-lowest/80 backdrop-blur-xl rounded-lg p-5 border border-outline-variant/10 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-error/50"></div>
            <div className="w-2 h-2 rounded-full bg-tertiary/50"></div>
            <div className="w-2 h-2 rounded-full bg-primary/50"></div>
            <span className="font-mono text-[10px] text-on-surface-variant ml-2 uppercase tracking-tighter">System Output Terminal_v1.0.4</span>
          </div>
          <div className="font-mono text-[11px] space-y-1.5 overflow-hidden">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-3">
                <span className={`font-bold ${log.type === 'OK' ? 'text-[#4CAF50]' : log.type === 'LOAD' ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {log.type}:
                </span>
                <span className="text-on-surface-variant">{log.message}</span>
              </div>
            ))}
            <div className="flex gap-3 opacity-50">
              <span className="text-on-surface-variant">_</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Absolute Corner Metadata */}
      <div className="fixed bottom-6 right-8 pointer-events-none">
        <p className="font-mono text-[10px] text-on-surface-variant/30 uppercase tracking-[0.2em] vertical-rl rotate-180">
          Node_01 // Synth_Labs // Internal_Build
        </p>
      </div>
    </div>
  );
}