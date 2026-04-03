"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createDevice, subscribeToDevicesByOwner, Device } from "@/lib/firestore/devices";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { usePlans } from "@/lib/hooks/usePlans";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceCreated?: (deviceId: string) => void;
}

type Step = "details" | "download" | "success" | "limit-reached";

export default function OnboardingWizard({ isOpen, onClose, onDeviceCreated }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { profile, deviceQuota: profileQuota } = useUserProfile(user?.uid);
  const { plans } = usePlans();
  const [step, setStep] = useState<Step>("details");
  const [setupToken, setSetupToken] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("ESP32");
  const [loading, setLoading] = useState(false);
  const [currentDeviceCount, setCurrentDeviceCount] = useState(0);
  const [createdDeviceId, setCreatedDeviceId] = useState<string | null>(null);

  const userPlan = plans.find(p => p.id === profile?.plan) || plans.find(p => p.id === "free");
  const deviceQuota = profileQuota || (userPlan?.nodes ?? 3);

  useEffect(() => {
    if (!user || !isOpen) return;
    
    const unsubscribe = subscribeToDevicesByOwner(user.uid, (devices) => {
      setCurrentDeviceCount(devices.length);
      
      // If we are waiting for a specific device to come online
      if (step === "download" && createdDeviceId) {
        const activeDevice = devices.find(d => d.id === createdDeviceId);
        if (activeDevice && activeDevice.status === "online") {
          setStep("success");
          onDeviceCreated?.(activeDevice.id);
        }
      }
    });
    
    return () => unsubscribe();
  }, [user, isOpen, step, createdDeviceId]);

  const handleGenerateAndProceed = async () => {
    if (!user || !deviceName.trim()) return;

    const quota = deviceQuota || 0;
    if (quota > 0 && currentDeviceCount >= quota) {
      setStep("limit-reached");
      return;
    }

    setLoading(true);
    try {
      const token = `RMCU-${Date.now().toString(36).toUpperCase().substring(0, 6)}`;
      setSetupToken(token);
      
      const newDeviceId = await createDevice({
        name: deviceName,
        board: selectedBoard,
        ownerId: user.uid,
        status: "offline",
        port: "Auto",
        ip: null,
        agentVersion: "1.0.0",
        sharedWith: [],
        setupToken: token
      });
      
      setCreatedDeviceId(newDeviceId);
      setStep("download");
    } catch (error) {
      console.error("Failed to create device:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("details");
    setDeviceName("");
    setSelectedBoard("ESP32");
    setCreatedDeviceId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#131313]/70 backdrop-blur-sm p-4">
      <div className="bg-[#2D2D2D] w-full max-w-[560px] rounded-lg border border-[#3C3C3C] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#3C3C3C]">
          <div>
            <h2 className="text-[18px] font-semibold text-[#F0F0F0]">Add New Device</h2>
            <p className="text-[11px] font-mono text-on-surface-variant mt-1">
              Step {step === "details" ? "1" : step === "download" ? "2" : "3"} of 3
            </p>
          </div>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors" onClick={handleClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "details" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-on-surface-variant">
                  Device Name
                </label>
                <input
                  className="w-full bg-surface-container-highest border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-3 placeholder:text-on-surface-variant/40 transition-all font-mono"
                  placeholder="e.g. Living-Room-Sensor"
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-on-surface-variant">
                  Board Type
                </label>
                <select 
                  className="w-full bg-surface-container-highest border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-3 font-mono cursor-pointer"
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                >
                  <option value="ESP32">ESP32</option>
                  <option value="ESP8266">ESP8266</option>
                  <option value="Arduino Uno">Arduino Uno</option>
                  <option value="Arduino Mega">Arduino Mega</option>
                  <option value="Arduino Nano">Arduino Nano</option>
                  <option value="Raspberry Pi Pico">Raspberry Pi Pico</option>
                  <option value="STM32">STM32</option>
                  <option value="Teensy">Teensy</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateAndProceed}
                  disabled={!deviceName.trim() || loading}
                  className="flex-1 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">vpn_key</span>
                  )}
                  {loading ? "Generating..." : "Generate Token & Proceed"}
                </button>
              </div>
            </div>
          )}

          {step === "download" && (
            <div className="space-y-6">
              <div className="bg-surface-container-low p-5 rounded-lg border border-primary/20 bg-primary/5 text-center">
                <h3 className="text-sm font-semibold text-[#F0F0F0] mb-2">
                  Your Secure Setup Token
                </h3>
                <p className="text-[12px] text-on-surface-variant mb-4">
                  Copy this token. You will need to enter it into the Host Agent.
                </p>
                <div className="bg-[#1E1E1E] py-4 px-6 rounded-lg border border-primary/40 inline-flex items-center gap-4">
                  <code className="text-primary font-mono text-2xl font-bold tracking-[0.1em]">{setupToken}</code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(setupToken)}
                    className="text-on-surface-variant hover:text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
              </div>

              <div className="bg-surface-container-low p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-[#F0F0F0] mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">download</span>
                  Install Host Agent
                </h3>
                <p className="text-[11px] text-on-surface-variant mb-4">
                  Download the zip package containing the host agent. Extract it and run the install script for your platform (Windows, Mac, or Linux). Look for the RemoteMCU icon in your system tray, right-click, and select "Setup Device".
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.open("/download", "_blank")}
                    className="w-full bg-[#1e1e1e] border border-[#3C3C3C] hover:border-primary py-3 rounded-lg text-[13px] font-bold text-[#F0F0F0] transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">folder_zip</span>
                    Go to Downloads Page
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 py-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <span className="text-[12px] font-mono text-on-surface-variant">Waiting for initial heartbeat...</span>
              </div>
            </div>
          )}

          {step === "limit-reached" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-4xl">block</span>
              </div>
              <h3 className="text-lg font-semibold text-[#F0F0F0] mb-2">Device Limit Reached</h3>
              <p className="text-[12px] text-on-surface-variant mb-2">
                Your current plan allows <strong className="text-white">{deviceQuota}</strong> device{deviceQuota !== 1 ? 's' : ''}.
              </p>
              <div className="flex flex-col gap-2 mt-6">
                <a
                  href="/pricing"
                  className="px-4 py-2.5 bg-primary text-on-primary rounded-lg font-bold hover:brightness-110 transition-all"
                >
                  Upgrade Plan
                </a>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded text-sm hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#4CAF50] text-4xl animate-[scale-in_0.3s_ease-out]">check_circle</span>
              </div>
              <h3 className="text-lg font-semibold text-[#F0F0F0] mb-2">Device Linked Successfully!</h3>
              <p className="text-[12px] text-on-surface-variant mb-6">
                The agent received your setup token and is streaming telemetry to your dashboard.
              </p>
              <button
                onClick={handleClose}
                className="px-8 py-2.5 bg-primary text-on-primary rounded-lg font-bold hover:brightness-110 transition-all font-mono"
              >
                GO TO CONTROL PANEL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}