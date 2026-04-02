"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getDevice, Device } from "@/lib/firestore/devices";
import ShareKeyPanel from "@/components/devices/ShareKeyPanel";

type DebugTab = "workspace" | "debugger" | "compiler" | "flasher";

const sampleCode = `#include <WiFi.h>
void setup() {
  Serial.begin(115200);
}

void loop() {
  Serial.println("Hello Remote MCU!");
  delay(1000);
}`;

export default function DeviceDebugPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const deviceId = params.id as string;
  
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  
  const [activeTab, setActiveTab] = useState<DebugTab>("workspace");
  const [serialInput, setSerialInput] = useState("");
  const [compilationOutput, setCompilationOutput] = useState("");
  const [flashProgress, setFlashProgress] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    const fetchDevice = async () => {
      if (!deviceId) return;
      
      try {
        const deviceData = await getDevice(deviceId);
        if (!deviceData) {
          setError("Device not found");
          setLoading(false);
          return;
        }
        
        setDevice(deviceData);
        
        // Check access: owner OR shared with user
        if (deviceData.ownerId === user?.uid || 
            (deviceData.sharedWith && deviceData.sharedWith.includes(user?.uid || ""))) {
          setHasAccess(true);
        } else {
          setError("You don't have access to this device");
        }
      } catch (err) {
        setError("Failed to load device");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDevice();
  }, [deviceId, user]);

  const handleSendCommand = () => {
    if (!serialInput.trim()) return;
    console.log("Sending:", serialInput);
    setSerialInput("");
  };

  const handleCompile = () => {
    setCompilationOutput(`[info] Compiling sketch...
[info] Linking everything together...
✓ COMPILATION SUCCESSFUL`);
  };

  const handleFlash = () => {
    setIsFlashing(true);
    setFlashProgress(0);
    const interval = setInterval(() => {
      setFlashProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsFlashing(false);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#131313]">
        <div className="text-primary font-mono">Loading device...</div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#131313]">
        <div className="text-center">
          <p className="text-error font-mono mb-4">{error || "Device not found"}</p>
          <Link href="/dashboard/devices" className="text-primary hover:underline">
            Back to Devices
          </Link>
        </div>
      </div>
    );
  }

  const isOnline = device.status === "online";

  return (
    <div className="h-screen flex flex-col bg-[#131313] overflow-hidden">
      {/* Top Navigation Shell */}
      <header className="flex justify-between items-center w-full px-6 h-14 bg-[#131313] z-50 shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-lg font-black tracking-tighter text-[#67d7dd]">SYNTHETIC_LABS_v1.0</span>
          <button 
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#00979D]/10 transition-colors group"
            onClick={() => router.push("/dashboard/devices")}
          >
            <span className="material-symbols-outlined text-[#00979D] text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            <span className="text-[10px] font-bold text-[#00979D] uppercase tracking-widest">Back to Devices</span>
          </button>
          <nav className="hidden md:flex items-center gap-6 h-14">
            <button 
              className={`font-['Inter'] tracking-tighter text-sm uppercase h-full flex items-center px-1 transition-colors ${activeTab === 'workspace' ? 'text-[#67d7dd] border-b-2 border-[#67d7dd]' : 'text-[#bcc9c9] hover:text-[#f0f0f0]'}`}
              onClick={() => setActiveTab("workspace")}
            >
              WORKSPACE
            </button>
            <button 
              className={`font-['Inter'] tracking-tighter text-sm uppercase h-full flex items-center px-1 transition-colors ${activeTab === 'debugger' ? 'text-[#67d7dd] border-b-2 border-[#67d7dd]' : 'text-[#bcc9c9] hover:text-[#f0f0f0]'}`}
              onClick={() => setActiveTab("debugger")}
            >
              DEBUGGER
            </button>
            <button 
              className={`font-['Inter'] tracking-tighter text-sm uppercase h-full flex items-center px-1 transition-colors ${activeTab === 'compiler' ? 'text-[#67d7dd] border-b-2 border-[#67d7dd]' : 'text-[#bcc9c9] hover:text-[#f0f0f0]'}`}
              onClick={() => setActiveTab("compiler")}
            >
              COMPILER
            </button>
            <button 
              className={`font-['Inter'] tracking-tighter text-sm uppercase h-full flex items-center px-1 transition-colors ${activeTab === 'flasher' ? 'text-[#67d7dd] border-b-2 border-[#67d7dd]' : 'text-[#bcc9c9] hover:text-[#f0f0f0]'}`}
              onClick={() => setActiveTab("flasher")}
            >
              FLASHER
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#1b1b1c] rounded-lg px-3 py-1.5 gap-2 group cursor-pointer hover:bg-[#2a2a2a] transition-all">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>memory</span>
            <span className="text-xs font-mono tracking-wider">{device.name}</span>
            <span className="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>
          </div>
          {device.ownerId === user?.uid && (
            <div className="flex items-center gap-2">
              <ShareKeyPanel deviceId={deviceId} deviceName={device.name} />
            </div>
          )}
        </div>
      </header>

      {/* Custom Device Toolbar */}
      <div className="h-12 bg-[#252526] flex items-center justify-between px-4 border-t border-[#1b1b1c] shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-[#1E1E1E] flex items-center gap-3 px-3 py-1 rounded border border-outline-variant/20 cursor-pointer">
            <span className="text-[11px] font-mono text-on-surface-variant uppercase tracking-widest">Select Device</span>
            <span className="material-symbols-outlined text-primary text-sm">developer_board</span>
            <span className="material-symbols-outlined text-xs text-on-surface-variant">arrow_drop_down</span>
          </div>
          <div className="bg-primary text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            {device.board}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-[#4CAF50] shadow-[0_0_8px_#4CAF50]' : 'bg-[#F44336]'}`}></div>
            <span className="text-xs font-medium uppercase tracking-wider">{isOnline ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="text-xs font-mono text-on-surface-variant">
            Port: {device.port || "None"}
          </div>
        </div>
      </div>

      {/* Main Viewport Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === "workspace" && (
          <>
            {/* Left Column: Code Editor (60%) */}
            <section className="w-[60%] flex flex-col bg-[#1E1E1E] border-r border-[#2a2a2a]">
              <div className="h-9 bg-[#252526] flex items-center">
                <div className="bg-[#1E1E1E] h-full px-4 flex items-center gap-3 border-r border-[#2a2a2a]">
                  <span className="material-symbols-outlined text-primary text-[16px]">description</span>
                  <span className="text-xs font-mono text-on-surface tracking-tight">sketch.ino</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[14px] hover:text-error cursor-pointer">close</span>
                </div>
              </div>
              <div className="flex-1 overflow-auto flex font-mono text-[13px] leading-relaxed p-4">
                <div className="w-10 flex flex-col text-right pr-4 text-[#606060] select-none border-r border-outline-variant/10 mr-4">
                  {[...Array(15)].map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>
                <div className="flex-1 whitespace-pre text-[#e5e2e1]">
                  <pre className="text-sm">{sampleCode}</pre>
                </div>
              </div>
              <div className="h-12 bg-[#252526] flex items-center justify-between px-4 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <button className="bg-primary-container hover:bg-primary text-on-primary-container px-4 py-1.5 rounded flex items-center gap-2 text-[11px] font-bold uppercase transition-all active:scale-95">
                    <span className="material-symbols-outlined text-[16px]">file_upload</span>
                    Upload
                  </button>
                  <button 
                    className="border border-primary-container/40 hover:border-primary text-primary px-4 py-1.5 rounded flex items-center gap-2 text-[11px] font-bold uppercase transition-all"
                    onClick={handleCompile}
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Verify
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-[#1E1E1E] px-3 py-1 rounded text-[10px] font-mono text-on-surface-variant flex items-center gap-2 border border-outline-variant/10">
                    Board: <span className="text-on-surface font-bold">{device.board}</span>
                  </div>
                  <div className="bg-[#1E1E1E] px-3 py-1 rounded text-[10px] font-mono text-on-surface-variant flex items-center gap-2 border border-outline-variant/10">
                    Port: <span className="text-on-surface font-bold">{device.port || "N/A"}</span>
                  </div>
                </div>
              </div>
            </section>
            {/* Right Column (40%) */}
            <section className="w-[40%] flex flex-col bg-[#131313]">
              <div className="h-1/2 flex flex-col relative group">
                <div className="flex-1 bg-black overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/10">
                    <span className="w-2 h-2 bg-error rounded-full animate-pulse shadow-[0_0_8px_red]"></span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE_FEED</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-6xl text-primary/30">videocam</span>
                      <p className="text-on-surface-variant text-sm mt-2">Camera feed placeholder</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-1/2 flex flex-col bg-[#1E1E1E] border-t border-[#2a2a2a]">
                <div className="h-9 bg-[#252526] flex items-center justify-between px-4">
                  <span className="text-[11px] font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[16px]">terminal</span>
                    Serial Monitor
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-on-surface-variant font-mono">BAUD:</span>
                      <div className="bg-[#1E1E1E] px-2 py-0.5 rounded text-[10px] font-mono border border-outline-variant/20 flex items-center gap-1 cursor-pointer">
                        115200
                        <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
                      </div>
                    </div>
                    <button className="text-[10px] text-on-surface-variant hover:text-on-surface uppercase font-bold transition-colors">Clear</button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-[13px] space-y-1 bg-[#131313]/50">
                  <div className="flex gap-4">
                    <span className="w-20 text-on-surface-variant shrink-0">[--:--:--]</span>
                    <span className="text-on-surface-variant italic">Waiting for serial data...</span>
                  </div>
                </div>
                <div className="h-12 bg-[#2D2D2D] p-2 flex items-center gap-2">
                  <input 
                    className="flex-1 bg-[#1E1E1E] border-none text-[12px] font-mono text-on-surface focus:ring-1 focus:ring-primary rounded px-3 py-1.5 placeholder:text-on-surface-variant/40"
                    placeholder="Type command to send..."
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                  />
                  <button 
                    className="bg-primary px-4 py-1.5 rounded text-on-primary text-[11px] font-black uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all"
                    onClick={handleSendCommand}
                  >
                    Send
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "debugger" && (
          <div className="flex-1 items-center justify-center text-on-surface-variant">
            <p className="font-mono">Debugger view - connect to device to use</p>
          </div>
        )}

        {activeTab === "compiler" && (
          <div className="flex flex-1 flex-col md:flex-row">
            <section className="w-full md:w-3/5 flex flex-col bg-[#1E1E1E]">
              <div className="flex-1 font-mono text-sm overflow-auto flex bg-[#0e0e0e] p-4">
                <pre className="text-on-surface">{sampleCode}</pre>
              </div>
              <div className="h-12 bg-[#252526] flex items-center justify-between px-4 border-t border-outline-variant/10">
                <button 
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#264d4f] text-primary rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-all"
                  onClick={handleCompile}
                >
                  <span className="material-symbols-outlined text-sm">check</span> Verify
                </button>
              </div>
            </section>
            <section className="w-full md:w-2/5 flex flex-col bg-[#131313] overflow-hidden border-l border-outline-variant/10">
              <div className="flex-1 p-6 font-mono text-xs leading-relaxed bg-[#0e0e0e] overflow-auto">
                {compilationOutput ? (
                  <pre className="whitespace-pre-wrap">{compilationOutput}</pre>
                ) : (
                  <p className="text-on-surface-variant animate-pulse">_</p>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "flasher" && (
          <div className="flex-1 p-8 flex flex-col gap-6">
            <div className="flex justify-between items-end border-b border-outline-variant/10 pb-4">
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-on-surface">Flash Firmware</h1>
                <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-widest mt-1">Direct Binary Upload Protocol</p>
              </div>
            </div>
            <button 
              className="flex-1 max-w-md bg-gradient-to-br from-primary to-primary-container text-[#003739] py-4 rounded-lg font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/10"
              onClick={handleFlash}
              disabled={isFlashing}
            >
              <span className="material-symbols-outlined text-xl">bolt</span>
              {isFlashing ? `Flashing... ${flashProgress}%` : 'FLASH FIRMWARE'}
            </button>
          </div>
        )}
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-6 bg-[#007acc] text-white text-[10px] flex items-center justify-between px-3 font-mono shrink-0">
        <div className="flex items-center gap-4">
          <span>{device.status.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln 1, Col 1</span>
        </div>
      </footer>
    </div>
  );
}