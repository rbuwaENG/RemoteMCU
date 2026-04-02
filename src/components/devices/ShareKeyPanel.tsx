"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useShareKey } from "@/lib/hooks/useShareKey";
import { createShareKey, revokeShareKey, deleteShareKey } from "@/lib/firestore/shareKeys";
import { copyToClipboard } from "@/lib/utils";

interface ShareKeyPanelProps {
  deviceId: string;
  deviceName: string;
}

export default function ShareKeyPanel({ deviceId, deviceName }: ShareKeyPanelProps) {
  const { user } = useAuth();
  const { shareKeys, activeKey, loading } = useShareKey(deviceId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const handleGenerateKey = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      await createShareKey(deviceId, user.uid, 24);
    } catch (error) {
      console.error("Failed to create share key:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!activeKey) return;
    try {
      await revokeShareKey(activeKey.id || "");
    } catch (error) {
      console.error("Failed to revoke share key:", error);
    }
  };

  const handleCopyKey = () => {
    if (activeKey?.key) {
      copyToClipboard(activeKey.key);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#F0F0F0] flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">vpn_key</span>
          Share Device
        </h3>
      </div>

      {activeKey ? (
        <div className="space-y-4">
          <div className="bg-[#1E1E1E] border border-[#3C3C3C] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <code className="text-xl font-mono text-primary tracking-wider">{activeKey.key}</code>
              <button
                onClick={handleCopyKey}
                className="p-2 text-on-surface-variant hover:text-primary transition-colors"
              >
                {showCopied ? (
                  <span className="material-symbols-outlined text-sm text-[#4CAF50]">check</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                )}
              </button>
            </div>
            {activeKey.expiresAt && (
              <p className="text-[10px] text-on-surface-variant mt-2">
                Expires: {activeKey.expiresAt.toDate ? activeKey.expiresAt.toDate().toLocaleString() : "N/A"}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRevokeKey}
              className="flex-1 px-3 py-2 border border-error/20 text-error rounded-lg text-xs font-medium hover:bg-error/10 transition-colors"
            >
              Revoke Access
            </button>
          </div>

          {activeKey.grantedTo && (
            <p className="text-[10px] text-on-surface-variant">
              This key has been redeemed by another user.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[12px] text-on-surface-variant">
            Generate a share key to allow others to access this device remotely.
          </p>
          <button
            onClick={handleGenerateKey}
            disabled={isGenerating}
            className="w-full px-4 py-2.5 bg-primary text-on-primary rounded-lg font-bold text-sm disabled:opacity-50 hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {isGenerating ? "Generating..." : "Generate Share Key"}
          </button>
        </div>
      )}

      {shareKeys.length > 0 && (
        <div className="mt-6 pt-4 border-t border-outline-variant/20">
          <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2">Recent Keys</p>
          <div className="space-y-2">
            {shareKeys.slice(0, 3).map((key, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px]">
                <span className="font-mono text-on-surface-variant">{key.key}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] ${key.revoked ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                  {key.revoked ? "Revoked" : "Active"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}