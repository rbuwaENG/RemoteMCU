"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createDevice, subscribeToDevicesByOwner, updateDevice, Device } from "@/lib/firestore/devices";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { usePlans } from "@/lib/hooks/usePlans";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceCreated?: (deviceId: string) => void;
}

type Step = "download" | "waiting" | "select" | "confirm" | "limit-reached";

export default function OnboardingWizard({ isOpen, onClose, onDeviceCreated }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { profile, deviceQuota: profileQuota } = useUserProfile(user?.uid);
  const { plans } = usePlans();
  const [step, setStep] = useState<Step>("download");
  const [setupToken] = useState(() => `RMCU-${Date.now().toString(36).toUpperCase()}`);
  const [deviceName, setDeviceName] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [detectedPort, setDetectedPort] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDevices, setPendingDevices] = useState<Device[]>([]);
  const [currentDeviceCount, setCurrentDeviceCount] = useState(0);

  const userPlan = plans.find(p => p.id === profile?.plan) || plans.find(p => p.id === "free");
  const deviceQuota = profileQuota || (userPlan?.nodes ?? 3);

  useEffect(() => {
    if (!user || !isOpen) return;
    
    const unsubscribe = subscribeToDevicesByOwner(user.uid, (devices) => {
      setCurrentDeviceCount(devices.length);
      const myPending = devices.filter(d => d.status === "offline");
      setPendingDevices(myPending);
    });
    
    return () => unsubscribe();
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen || step !== "waiting" || !user) return;

    const unsubscribe = subscribeToDevicesByOwner(user.uid, (devices) => {
      const myPending = devices.filter(d => d.status === "offline");
      setPendingDevices(myPending);
      if (myPending.length > 0) {
        const device = myPending[0];
        setDetectedPort(device.port || "USB");
        setSelectedBoard(device.board || "ESP32");
        setStep("select");
      }
    });

    return () => unsubscribe();
  }, [isOpen, step, user]);

  const handleStartWaiting = () => {
    const quota = deviceQuota || 0;
    if (quota > 0 && currentDeviceCount >= quota) {
      setStep("limit-reached");
      return;
    }
    setStep("waiting");
  };

  const handleSkipToSelect = () => {
    const quota = deviceQuota || 0;
    if (quota > 0 && currentDeviceCount >= quota) {
      setStep("limit-reached");
      return;
    }
    setStep("select");
  };

  const handleConfirmDevice = async () => {
    if (!user || !deviceName.trim()) return;

    const quota = deviceQuota || 0;
    if (quota > 0 && currentDeviceCount >= quota) {
      setStep("limit-reached");
      return;
    }

    setLoading(true);
    try {
      if (pendingDevices.length > 0) {
        const existingDevice = pendingDevices[0];
        await updateDevice(existingDevice.id, {
          name: deviceName,
          board: selectedBoard,
          ownerId: user.uid,
          status: "online",
          port: detectedPort,
          ip: null,
          agentVersion: "1.0.0"
        });
        onDeviceCreated?.(existingDevice.id);
      } else {
        const deviceId = await createDevice({
          name: deviceName,
          board: selectedBoard,
          ownerId: user.uid,
          status: "offline",
          port: detectedPort,
          ip: null,
          agentVersion: "1.0.0",
          sharedWith: []
        });
        onDeviceCreated?.(deviceId);
      }
      setStep("confirm");
    } catch (error) {
      console.error("Failed to create device:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("download");
    setDeviceName("");
    setSelectedBoard("");
    setDetectedPort("");
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
              Step {step === "download" ? "1" : step === "waiting" ? "2" : step === "select" ? "3" : "4"} of 4
            </p>
          </div>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors" onClick={handleClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "download" && (
            <div className="space-y-6">
              <div className="bg-surface-container-low p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-[#F0F0F0] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">computer</span>
                  Download Host Agent
                </h3>
                <p className="text-[12px] text-on-surface-variant mb-4">
                  Download and run the RemoteMCU host agent on your computer to detect connected microcontrollers.
                </p>
                <div className="flex gap-2">
                  <a 
                    href="/download" 
                    target="_blank"
                    className="flex-1 bg-surface-container-high py-2 rounded text-xs font-medium hover:bg-surface-container-high/80 transition-colors text-center"
                  >
                    Download for Windows
                  </a>
                  <a 
                    href="/download" 
                    target="_blank"
                    className="flex-1 bg-surface-container-high py-2 rounded text-xs font-medium hover:bg-surface-container-high/80 transition-colors text-center"
                  >
                    Download for Mac
                  </a>
                </div>
              </div>

              <div className="bg-surface-container-low p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-[#F0F0F0] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">key</span>
                  Your Setup Token
                </h3>
                <div className="bg-[#1E1E1E] p-3 rounded border border-[#3C3C3C]">
                  <code className="text-primary font-mono text-sm">{setupToken}</code>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-2">
                  Run the agent with: <code className="font-mono">python host_agent.py --token {setupToken}</code>
                </p>
              </div>

              <button
                onClick={handleStartWaiting}
                className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:brightness-110 transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {step === "waiting" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl animate-pulse">sync</span>
              </div>
              <h3 className="text-lg font-semibold text-[#F0F0F0] mb-2">Waiting for Agent...</h3>
              <p className="text-[12px] text-on-surface-variant mb-6">
                The host agent should detect your devices and connect to Firestore. This usually takes 10-30 seconds.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setStep("download")}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded text-sm hover:bg-surface-container-high transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSkipToSelect}
                  className="px-4 py-2 bg-primary text-on-primary rounded text-sm font-medium"
                >
                  Skip / Manual Entry
                </button>
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
              <p className="text-[12px] text-on-surface-variant mb-6">
                You already have <strong className="text-white">{currentDeviceCount}</strong> device{currentDeviceCount !== 1 ? 's' : ''} registered.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="/pricing"
                  className="px-4 py-2.5 bg-primary text-on-primary rounded-lg font-bold hover:brightness-110 transition-all"
                >
                  Upgrade Plan
                </a>
                <button
                  onClick={() => setStep("download")}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded text-sm hover:bg-surface-container-high transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {step === "select" && (
            <div className="space-y-6">
              <div className="bg-surface-container-low p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-[#F0F0F0] mb-3">Detected Device</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-on-surface-variant">Board</span>
                    <span className="text-sm text-[#F0F0F0]">{selectedBoard}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-on-surface-variant">Port</span>
                    <span className="text-sm text-[#F0F0F0]">{detectedPort}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-on-surface-variant">
                  Device Name
                </label>
                <input
                  className="w-full bg-surface-container-highest border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-3 placeholder:text-on-surface-variant/40 transition-all font-mono"
                  placeholder="e.g. Garden-Sensor-01"
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDevice}
                  disabled={!deviceName.trim() || loading}
                  className="flex-1 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                >
                  {loading ? "Registering..." : "Register Device"}
                </button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#4CAF50] text-4xl">check_circle</span>
              </div>
              <h3 className="text-lg font-semibold text-[#F0F0F0] mb-2">Device Registered!</h3>
              <p className="text-[12px] text-on-surface-variant mb-6">
                Your device has been added to the dashboard. You can now monitor and control it remotely.
              </p>
              <button
                onClick={handleClose}
                className="px-8 py-2.5 bg-primary text-on-primary rounded-lg font-bold hover:brightness-110 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}