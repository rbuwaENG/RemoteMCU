"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { validateShareKey, redeemShareKey } from "@/lib/firestore/shareKeys";
import { addSharedUser, getDevice } from "@/lib/firestore/devices";
import { useNotifications } from "@/lib/hooks/useNotifications";

interface LinkDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceLinked?: (deviceName: string) => void;
}

export default function LinkDeviceModal({ isOpen, onClose, onDeviceLinked }: LinkDeviceModalProps) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [shareKey, setShareKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !shareKey.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const keyData = await validateShareKey(shareKey.trim().toUpperCase());
      console.log("Share key validation result:", keyData);
      
      if (!keyData) {
        setError("Invalid or expired share key");
        return;
      }

      if (keyData.grantedTo && keyData.grantedTo !== user.uid) {
        setError("This key has already been redeemed");
        return;
      }

      if (keyData.grantedTo === user.uid) {
        setError("You have already redeemed this key");
        return;
      }

      if (keyData.ownerId === user.uid) {
        setError("You cannot use your own share key");
        return;
      }

      const device = await getDevice(keyData.deviceId);
      if (!device) {
        setError("Device not found");
        return;
      }

      const result = await addSharedUser(keyData.deviceId, user.uid);
      console.log("addSharedUser result:", result);
      if (!result.success) {
        setError(result.message || "Failed to add shared user");
        addNotification("error", "Cannot Link Device", result.message || "Failed to add shared user");
        return;
      }
      
      console.log("Calling redeemShareKey with:", keyData.id, user.uid);
      try {
        await redeemShareKey(keyData.id!, user.uid);
        console.log("redeemShareKey completed");
      } catch (redeemErr: any) {
        console.error("redeemShareKey failed:", redeemErr);
        console.error("Error code:", redeemErr?.code);
        console.error("Error message:", redeemErr?.message);
        
        // Check if it's a permission error
        if (redeemErr?.code === 'permission-denied') {
          // Still mark as success since addSharedUser worked
          addNotification("success", "Device Linked", `Successfully linked ${device.name}`);
          setSuccess(true);
          onDeviceLinked?.(device.name);
          setTimeout(() => {
            handleClose();
          }, 2000);
          return;
        }
        
        setError("Failed to redeem share key. Please try again.");
        return;
      }

      // Success - device linked
      console.log("Device linked successfully, showing notification");
      console.log("Device name:", device.name);
      addNotification("success", "Device Linked", `Successfully linked ${device.name}`);
      console.log("Notification added");
      setSuccess(true);
      console.log("setSuccess(true) called");
      onDeviceLinked?.(device.name);
      console.log("onDeviceLinked callback called");
      
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError("Failed to validate share key. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShareKey("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#131313]/70 backdrop-blur-sm p-4">
      <div className="bg-[#2D2D2D] w-full max-w-[420px] rounded-lg border border-[#3C3C3C] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#3C3C3C]">
          <div>
            <h2 className="text-[18px] font-semibold text-[#F0F0F0]">Link Shared Device</h2>
            <p className="text-[11px] font-mono text-on-surface-variant mt-1">Enter a share key to connect</p>
          </div>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors" onClick={handleClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#4CAF50] text-3xl">check_circle</span>
              </div>
              <h3 className="text-lg font-semibold text-[#F0F0F0] mb-2">Device Linked!</h3>
              <p className="text-[12px] text-on-surface-variant">
                The device has been added to your shared devices.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-on-surface-variant">
                  Share Key
                </label>
                <input
                  className="w-full bg-surface-container-highest border-none border-b-2 border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-3 placeholder:text-on-surface-variant/40 transition-all font-mono text-center text-lg tracking-wider uppercase"
                  placeholder="XXXXXX"
                  type="text"
                  value={shareKey}
                  onChange={(e) => setShareKey(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-sm">error</span>
                  <p className="text-[12px] text-error">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!shareKey.trim() || loading}
                  className="flex-1 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                >
                  {loading ? "Validating..." : "Link Device"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}