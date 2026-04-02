"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDevices } from "@/lib/hooks/useDevices";
import { deleteDevice, updateDevice, Device } from "@/lib/firestore/devices";
import { createShareKey } from "@/lib/firestore/shareKeys";
import LinkDeviceModal from "@/components/devices/LinkDeviceModal";

export default function DevicesPage() {
  const { user } = useAuth();
  const { devices, totalDevices, onlineDevices, offlineDevices, loading } = useDevices(user?.uid);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("All Platforms");
  const [deviceName, setDeviceName] = useState("");
  const [deviceShareKey, setDeviceShareKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);

  const handleDeleteDevice = async () => {
    if (!selectedDevice) return;
    try {
      await deleteDevice(selectedDevice.id);
    } catch (error) {
      console.error("Failed to delete device:", error);
    }
    setShowDeleteModal(false);
    setSelectedDevice(null);
  };

  const openSettings = (device: Device) => {
    setSelectedDevice(device);
    setDeviceName(device.name);
    setDeviceShareKey(null);
    setShowSettingsModal(true);
  };

  const generateShareKey = async () => {
    if (!selectedDevice || !user) return;
    
    setGeneratingKey(true);
    try {
      const key = await createShareKey(selectedDevice.id, user.uid, 168); // 7 days
      setDeviceShareKey(key);
    } catch (error) {
      console.error("Failed to generate share key:", error);
    }
    setGeneratingKey(false);
  };

  const handleSaveSettings = async () => {
    if (!selectedDevice) return;
    try {
      const { updateDevice } = await import("@/lib/firestore/devices");
      await updateDevice(selectedDevice.id, { name: deviceName });
      alert("Device settings saved!");
      setShowSettingsModal(false);
    } catch (error) {
      console.error("Failed to update device:", error);
    }
  };

  const handleDeviceLinked = (deviceName: string) => {
    console.log("Device linked:", deviceName);
  };

  const formatLastSeen = (lastSeen: any) => {
    if (!lastSeen) return "Never";
    if (lastSeen.toDate) {
      const date = lastSeen.toDate();
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    }
    return "Unknown";
  };

  const boards = [
    { value: "ESP32", label: "ESP32" },
    { value: "ESP8266", label: "ESP8266" },
    { value: "Arduino Uno", label: "Arduino Uno" },
    { value: "Arduino Nano", label: "Arduino Nano" },
    { value: "STM32", label: "STM32" },
    { value: "Raspberry Pi Pico", label: "Raspberry Pi Pico" },
  ];

  const issuesCount = devices.filter(d => d.status === "error").length;

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === "All Platforms" || 
      (filterPlatform === "ESP32" && device.board.includes("ESP")) ||
      (filterPlatform === "Arduino" && device.board.includes("Arduino")) ||
      (filterPlatform === "STM32" && device.board.includes("STM"));
    return matchesSearch && matchesPlatform;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#F0F0F0] mb-2">My Devices</h1>
          <p className="text-on-surface-variant font-mono text-xs">{totalDevices} DEVICES REGISTERED</p>
        </div>
        <button 
          onClick={() => setShowLinkModal(true)}
          className="flex items-center gap-2 border border-primary/30 px-4 py-2.5 rounded-lg text-primary font-bold text-sm hover:bg-primary/10 transition-all"
        >
          <span className="material-symbols-outlined text-sm">link</span>
          Link Device
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input
            className="w-full bg-surface-container-high border-none rounded-sm pl-10 pr-4 py-2.5 text-sm focus:ring-0 focus:border-b-2 focus:border-primary transition-all text-on-surface placeholder:text-on-surface-variant/50"
            placeholder="Search devices..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-on-surface-variant uppercase tracking-widest">Filter By</span>
          <select 
            className="bg-surface-container-high border-none rounded-sm text-xs py-2 pl-3 pr-8 focus:ring-0 text-primary font-medium appearance-none cursor-pointer"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
          >
            <option>All Platforms</option>
            <option>ESP32</option>
            <option>Arduino</option>
            <option>STM32</option>
          </select>
          <button className="p-2 bg-surface-container-high rounded-sm text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">filter_list</span>
          </button>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => (
          <div 
            key={device.id} 
            className={`bg-[#2D2D2D] border border-[#3C3C3C] rounded-xl overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all flex flex-col group ${device.status === 'offline' ? 'opacity-75 grayscale-[0.5]' : ''}`}
          >
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-[#4CAF50] shadow-[0_0_8px_#4CAF50]' : 'bg-[#F44336] shadow-[0_0_8px_#F44336]'}`}></span>
                    <h3 className="font-mono text-sm font-bold tracking-tight text-[#F0F0F0]">{device.name}</h3>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-sm ${device.status === 'offline' ? 'bg-surface-variant text-on-surface-variant' : 'bg-primary/10 text-primary'} text-[10px] font-bold tracking-wider uppercase`}>
                    {device.board}
                  </span>
                </div>
                <button className="text-on-surface-variant hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">more_vert</span>
                </button>
              </div>
              <div className="space-y-3 py-4">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#A0A0A0] font-mono">Last Heartbeat</span>
                  <span className={`font-mono ${device.status === 'offline' ? 'text-on-surface-variant' : 'text-on-surface'}`}>{formatLastSeen(device.lastSeen)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#A0A0A0] font-mono">IP Address</span>
                  <span className={`font-mono ${device.status === 'offline' ? 'text-on-surface-variant' : 'text-on-surface'}`}>{device.ip || "None"}</span>
                </div>
              </div>
              <div className="mt-2 h-12 w-full bg-surface-container-lowest rounded overflow-hidden flex items-center justify-center">
                {device.status === 'offline' ? (
                  <span className="text-[10px] font-mono text-error uppercase tracking-tighter">Connection Lost</span>
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse"></div>
                )}
              </div>
            </div>
            <div className="p-3 bg-surface-container-high/50 flex gap-2">
              {device.status === 'offline' ? (
                <button className="flex-1 bg-surface-variant text-on-surface-variant py-2 rounded-lg text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">sync_problem</span>
                  Reconnect
                </button>
              ) : (
                <button 
                  onClick={() => window.open(`/device/${device.id}`, '_blank')}
                  className="flex-1 bg-primary text-on-primary py-2 rounded-lg text-xs font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">terminal</span>
                  Open Control Panel
                </button>
              )}
              <button 
                onClick={() => openSettings(device)}
                className="p-2 border border-outline-variant/30 rounded-lg text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">settings</span>
              </button>
              <button 
                className="p-2 border border-error/20 rounded-lg text-error hover:bg-error/10 transition-colors"
                onClick={() => { setSelectedDevice(device); setShowDeleteModal(true); }}
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        ))}

        {/* Add Device Card */}
        <Link 
          href="/dashboard/devices/onboard"
          className="border-2 border-dashed border-[#3C3C3C] rounded-xl flex flex-col items-center justify-center p-8 bg-surface-container-low/30 hover:bg-surface-container-low/50 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-primary">add</span>
          </div>
          <p className="text-on-surface-variant font-mono text-xs uppercase tracking-widest group-hover:text-primary transition-colors">Register New Device</p>
          <p className="text-[10px] text-on-surface-variant/40 mt-2">Setup and onboard a new device</p>
        </Link>
      </div>

      {/* System Stats Footer */}
      <div className="mt-16 grid grid-cols-12 gap-8 items-end">
        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-3xl font-extrabold tracking-tighter text-[#F0F0F0]">System Pulse</h2>
            <div className="flex-1 h-[1px] bg-outline-variant/20"></div>
          </div>
          <p className="text-on-surface-variant text-sm max-w-xl leading-relaxed">
            All connected nodes are synchronized with the <span className="text-primary font-mono">us-east-1-relay</span>. 
            Real-time telemetry is being recorded at 250ms intervals. No latency anomalies detected in the last 24 hours.
          </p>
        </div>
        <div className="col-span-12 lg:col-span-4 flex justify-end">
          <div className="bg-surface-container-high p-6 rounded-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-[0.2em]">Cluster Health</span>
              <span className="text-primary text-[10px] font-bold">{totalDevices > 0 ? '99.8%' : '0%'}</span>
            </div>
            <div className="w-full h-1 bg-surface-container-lowest rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[99.8%] shadow-[0_0_8px_#67d7dd]"></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant uppercase mb-1">Online</p>
                <p className="font-mono text-sm text-[#F0F0F0]">{onlineDevices}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant uppercase mb-1">Standby</p>
                <p className="font-mono text-sm text-[#F0F0F0]">{offlineDevices}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant uppercase mb-1">Issues</p>
                <p className="font-mono text-sm text-error">{issuesCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDevice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-md bg-[#2D2D2D] border border-[#3C3C3C] rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-error">delete_forever</span>
                </div>
                <h2 className="text-[18px] font-bold text-error">Delete Device?</h2>
              </div>
              {/* Message */}
              <p className="text-[14px] leading-relaxed text-[#A0A0A0] mb-8">
                This action is permanent and cannot be undone. All data and configuration for this device will be erased.
              </p>
              {/* Confirmation Input */}
              <div className="space-y-2 mb-8">
                <label className="block text-[12px] uppercase tracking-wider font-mono text-[#A0A0A0]">Type the device name to confirm</label>
                <div className="relative group">
                  <input
                    className="w-full bg-[#1E1E1E] border border-[#3C3C3C] rounded-lg px-4 py-3 text-[#F0F0F0] font-mono text-sm focus:outline-none focus:border-error transition-colors"
                    type="text"
                    value={selectedDevice.name}
                    readOnly
                  />
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all text-sm font-semibold"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2.5 rounded-lg bg-error text-white hover:bg-error/90 transition-all text-sm font-bold shadow-lg shadow-error/20"
                  onClick={handleDeleteDevice}
                >
                  Delete Device
                </button>
              </div>
            </div>
            {/* Technical Metadata Footer */}
            <div className="px-6 py-3 bg-[#1e1e1e]/50 border-t border-[#3C3C3C]/50 flex justify-between items-center">
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase">ID: DEV-{selectedDevice.id}</span>
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase">AUTH: REQ-PROD-DEL</span>
            </div>
          </div>
        </div>
      )}

      <LinkDeviceModal 
        isOpen={showLinkModal} 
        onClose={() => setShowLinkModal(false)}
        onDeviceLinked={handleDeviceLinked}
      />

      {/* Settings Modal */}
      {showSettingsModal && selectedDevice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4" onClick={() => setShowSettingsModal(false)}>
          <div className="w-full max-w-md bg-[#2D2D2D] border border-[#3C3C3C] rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">settings</span>
                </div>
                <h2 className="text-[18px] font-bold text-[#F0F0F0]">Device Settings</h2>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[12px] uppercase tracking-wider font-mono text-[#A0A0A0] mb-2">Device Name</label>
                  <input
                    className="w-full bg-[#1E1E1E] border border-[#3C3C3C] rounded-lg px-4 py-3 text-[#F0F0F0] font-mono text-sm focus:outline-none focus:border-primary transition-colors"
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[12px] uppercase tracking-wider font-mono text-[#A0A0A0] mb-2">Board Type</label>
                  <div className="w-full bg-[#1E1E1E] border border-[#3C3C3C] rounded-lg px-4 py-3 text-[#A0A0A0] font-mono text-sm">
                    {selectedDevice.board}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] uppercase tracking-wider font-mono text-[#A0A0A0] mb-2">Device ID</label>
                  <div className="w-full bg-[#1E1E1E] border border-[#3C3C3C] rounded-lg px-4 py-3 text-[#A0A0A0] font-mono text-sm">
                    {selectedDevice.id}
                  </div>
                </div>

                {/* Share Key Section */}
                <div className="border-t border-[#3C3C3C] pt-4 mt-4">
                  <label className="block text-[12px] uppercase tracking-wider font-mono text-[#A0A0A0] mb-2">Share Device</label>
                  <p className="text-[10px] text-on-surface-variant mb-3">Generate a key to share this device with others</p>
                  
                  {deviceShareKey ? (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">key</span>
                        <span className="font-mono text-primary font-bold tracking-wider">{deviceShareKey}</span>
                      </div>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(deviceShareKey); }}
                        className="text-xs text-on-surface-variant hover:text-primary"
                      >
                        Copy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={generateShareKey}
                      disabled={generatingKey}
                      className="w-full py-2 border border-primary/30 text-primary text-xs font-bold rounded-lg hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">vpn_key</span>
                      {generatingKey ? "Generating..." : "Generate Share Key"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all text-sm font-semibold"
                  onClick={() => setShowSettingsModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-on-primary hover:brightness-110 transition-all text-sm font-bold shadow-lg shadow-primary/20"
                  onClick={handleSaveSettings}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}