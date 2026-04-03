"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getHostAgentDownloads, HostAgentDownload } from "@/lib/firebase/storage";

export default function DownloadAgentPage() {
  const [downloads, setDownloads] = useState<HostAgentDownload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDownloads = async () => {
      try {
        const data = await getHostAgentDownloads();
        setDownloads(data);
      } catch (error) {
        console.error("Failed to load downloads:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDownloads();
  }, []);

  return (
    <div className="min-h-screen bg-[#131313] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <Link href="/dashboard/devices/onboard" className="text-primary hover:underline text-sm">
            ← Back to Device Setup
          </Link>
        </div>

        <div className="bg-[#2D2D2D] border border-[#3C3C3C] rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">computer</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F0F0F0]">RemoteMCU Host Agent</h1>
              <p className="text-sm text-on-surface-variant">v1.0.0 - Connect your microcontrollers</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-container-low p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-[#F0F0F0] mb-3">Quick Start</h3>
              <ol className="text-xs text-on-surface-variant space-y-2">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">1.</span>
                  Download the agent for your OS
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">2.</span>
                  Extract the zip file
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">3.</span>
                  Run <code className="font-mono text-primary">install_windows.bat</code>, <code className="font-mono text-primary">install_mac.sh</code>, or <code className="font-mono text-primary">install_linux.sh</code>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">4.</span>
                  Right-click the system tray icon and select "Setup Device" to enter your token.
                </li>
              </ol>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="p-4 bg-surface-container-high rounded-lg animate-pulse h-20"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {downloads.map((download) => (
                  download.url ? (
                    <a 
                      key={download.id}
                      href={download.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-surface-container-high rounded-lg hover:bg-surface-container-high/80 transition-colors border border-outline-variant/20"
                    >
                      <span className="material-symbols-outlined text-primary">download</span>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{download.name}</p>
                        <p className="text-[10px] text-on-surface-variant">ZIP • {download.size}</p>
                      </div>
                    </a>
                  ) : null
                ))}
                <a 
                  href="https://github.com/yourusername/host-agent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-surface-container-high rounded-lg hover:bg-surface-container-high/80 transition-colors border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-primary">code</span>
                  <div>
                    <p className="text-sm font-medium text-on-surface">Source Code</p>
                    <p className="text-[10px] text-on-surface-variant">GitHub • View Repository</p>
                  </div>
                </a>
              </div>
            )}

            <div className="bg-surface-container-low p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-[#F0F0F0] mb-2">Requirements</h3>
              <ul className="text-xs text-on-surface-variant space-y-1">
                <li>• Python 3.8 or higher</li>
                <li>• USB serial device or network-connected MCU</li>
                <li>• Network connection for Firestore sync</li>
              </ul>
            </div>

            <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#3C3C3C]">
              <h3 className="text-xs font-mono text-on-surface-variant mb-2">Manual Setup (from source)</h3>
              <code className="text-xs font-mono text-primary block">
                pip install -r requirements.txt<br/>
                python src/tray_app.py
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
