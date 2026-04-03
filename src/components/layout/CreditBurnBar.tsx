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

const getMaxCredits = (plan: string): number => {
  switch (plan?.toLowerCase()) {
    case "free": return 25;
    case "starter": return 50;
    case "popular": return 200;
    case "pro": return 500;
    default: return 25;
  }
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
  const maxCredits = getMaxCredits(plan);
  const creditPercentage = Math.min(100, (credits / maxCredits) * 100);

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
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3 scale-90 sm:scale-100">
      {isVisible && (
        <div 
          className={`bg-[#1E1E1E] border border-[#3C3C3C] rounded-lg shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right ${
            isOpen 
              ? "w-72 opacity-100 translate-y-0 scale-100" 
              : "w-72 opacity-0 translate-y-4 scale-95"
          }`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#67d7dd] text-lg">monitoring</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#67d7dd]">Credit Burn Rate</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-on-surface-variant hover:text-white transition-colors">
                 <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-on-surface-variant">Current Balance</span>
                <span className="text-sm font-black text-[#F0F0F0] tracking-tight">{credits} credits</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-on-surface-variant">Current Plan</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded uppercase tracking-widest">{plan}</span>
              </div>

              <div className="bg-surface-container-low rounded-lg p-3 mt-4 border border-[#3C3C3C]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-on-surface-variant font-medium">Usage Level</span>
                  <span className="text-[10px] font-mono text-orange-400">
                    {burnRate > 0 ? `~${burnRate} credits/hr` : "No recent activity"}
                  </span>
                </div>
                
                {/* Gauge Progress Bar */}
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden border border-black/20">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      creditPercentage > 50 ? "bg-gradient-to-r from-success to-primary" : 
                      creditPercentage > 20 ? "bg-gradient-to-r from-orange-400 to-orange-600" :
                      "bg-gradient-to-r from-red-500 to-red-700 animate-pulse"
                    }`}
                    style={{ width: `${creditPercentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-tighter text-on-surface-variant/60">Session Time</span>
                    <span className="text-[11px] font-bold text-[#F0F0F0]">
                      {estimatedMinutes > 0 ? `Est. ${estimatedMinutes} min` : "N/A"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-tighter text-on-surface-variant/60">Capacity</span>
                    <span className="block text-[11px] font-bold text-[#F0F0F0]">{Math.round(creditPercentage)}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link 
                  href="/dashboard/credits"
                  className="flex items-center justify-center w-full py-2.5 bg-primary text-on-primary text-[10px] font-black rounded hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest shadow-lg shadow-primary/10"
                >
                  Top Up Credits
                </Link>
                <div className="flex items-center gap-2 text-[9px] text-on-surface-variant mt-3 justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                  <span className="font-mono">Live tracking active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Floating Button */}
      <button 
        onClick={handleToggle}
        className={`w-14 h-14 bg-[#67d7dd] text-[#003739] rounded-lg shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all group relative border-b-4 border-[#00979D] ${
          isOpen ? "translate-y-1 border-b-0" : ""
        }`}
      >
        <span className={`material-symbols-outlined text-3xl transition-transform duration-500 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          {isOpen ? 'close' : 'bolt'}
        </span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[8px] font-bold text-on-primary rounded-full flex items-center justify-center animate-bounce shadow-lg">
            !
          </span>
        )}
      </button>
    </div>
  );
}
