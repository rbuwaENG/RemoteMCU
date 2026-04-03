"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useCreditTransactions } from "@/lib/hooks/useCreditTransactions";
import Link from "next/link";

const getTxDate = (createdAt: any): Date => {
  if (!createdAt) return new Date(0);
  if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
  if (createdAt.toDate) return createdAt.toDate();
  return new Date(createdAt);
};

export default function CreditBurnBar() {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const { transactions } = useCreditTransactions(user?.uid, 50);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [burnRate, setBurnRate] = useState(0);

  const credits = profile?.credits || 0;
  const plan = profile?.plan || "free";

  useEffect(() => {
    if (transactions.length > 0 && user) {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const burnTransactions = transactions.filter(t => {
        if (t.type !== "burn" || !t.createdAt) return false;
        const txDate = getTxDate(t.createdAt);
        return txDate > oneHourAgo;
      });
      
      const totalBurnedLastHour = burnTransactions.reduce((sum, t) => sum + Math.abs(t.credits), 0);
      
      let rate = 0;
      if (totalBurnedLastHour > 0) {
        rate = totalBurnedLastHour;
      } else {
        const burnTransactionsLast24h = transactions.filter(t => {
          if (t.type !== "burn" || !t.createdAt) return false;
          const txDate = getTxDate(t.createdAt);
          return txDate > oneDayAgo;
        });
        const totalBurnedLast24h = burnTransactionsLast24h.reduce((sum, t) => sum + Math.abs(t.credits), 0);
        rate = totalBurnedLast24h / 24;
      }
      
      setBurnRate(Math.max(0, Math.round(rate * 10) / 10));
    }
  }, [transactions, user]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      
      const collapseTimer = setTimeout(() => {
        setIsOpen(false);
      }, 30000);

      return () => clearTimeout(collapseTimer);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const estimatedMinutes = burnRate > 0 ? Math.floor(credits / burnRate) : credits > 0 ? credits * 60 : 0;

  if (!user) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3">
      {isVisible && (
        <div 
          className={`bg-[#1E1E1E] border border-[#3C3C3C] rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
            isOpen 
              ? "w-64 opacity-100 translate-y-0" 
              : "w-64 opacity-0 translate-y-4"
          }`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#67d7dd]">Credit Burn Rate</span>
              <span className="material-symbols-outlined text-[#67d7dd] text-sm">local_fire_department</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-on-surface-variant">Current Balance</span>
                <span className="text-sm font-bold text-[#F0F0F0]">{credits} credits</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-on-surface-variant">Current Plan</span>
                <span className="text-[11px] font-bold text-primary uppercase">{plan}</span>
              </div>

              <div className="border-t border-[#3C3C3C] pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-on-surface-variant">Burn Rate</span>
                  <span className="text-[10px] font-mono text-orange-400">
                    {burnRate > 0 ? `~${burnRate} credits/hr` : "No recent activity"}
                  </span>
                </div>
                
                <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${burnRate > 0 ? "bg-gradient-to-r from-orange-500 to-red-500 animate-pulse" : "bg-gray-600"}`}
                    style={{ width: burnRate > 0 ? `${Math.min(100, (burnRate / 10) * 100)}%` : "30%" }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[9px] text-on-surface-variant/60">Session Time</span>
                  <span className="text-[9px] text-on-surface-variant/60">
                    {estimatedMinutes > 0 ? `Est. ${estimatedMinutes} min` : "N/A"}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link 
                  href="/dashboard/credits"
                  className="flex items-center justify-center w-full py-2 bg-primary/10 text-primary text-[10px] font-bold rounded hover:bg-primary/20 transition-colors"
                >
                  Add Credits
                </Link>
                <div className="flex items-center gap-2 text-[9px] text-on-surface-variant mt-2 justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                  <span>Live tracking active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={handleToggle}
        className={`w-14 h-14 bg-[#67d7dd] text-[#003739] rounded-sm shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all ${
          isOpen ? "bg-[#4fb8be]" : ""
        }`}
      >
        <span className="material-symbols-outlined text-3xl animate-bounce">bolt</span>
      </button>
    </div>
  );
}
