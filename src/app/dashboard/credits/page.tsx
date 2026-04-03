"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { usePlans } from "@/lib/hooks/usePlans";
import { useCreditTransactions } from "@/lib/hooks/useCreditTransactions";
import Link from "next/link";

const defaultCreditPackages = [
  {
    name: "Starter",
    credits: 50,
    price: 2.99,
    nodes: 10,
    maxSharedUsers: 3,
    icon: "potted_plant",
    popular: false,
  },
  {
    name: "Popular",
    credits: 200,
    price: 9.99,
    nodes: -1,
    maxSharedUsers: 10,
    icon: "electric_bolt",
    popular: true,
  },
  {
    name: "Pro",
    credits: 500,
    price: 19.99,
    nodes: -1,
    maxSharedUsers: -1,
    icon: "rocket_launch",
    popular: false,
  },
];

export default function CreditsPage() {
  const { user } = useAuth();
  const { profile, credits, loading: profileLoading } = useUserProfile(user?.uid);
  const { plans, loading: plansLoading } = usePlans();
  const { transactions, loading: transactionsLoading } = useCreditTransactions(user?.uid);
  const [creditPackages, setCreditPackages] = useState(defaultCreditPackages);

  useEffect(() => {
    if (!plansLoading && plans.length > 0) {
      const packages = plans
        .filter((p: any) => p.active)
        .map((p: any) => ({
          id: p.id,
          name: p.name.replace(" Tier", ""),
          credits: p.credits,
          price: p.price,
          nodes: p.nodes,
          maxSharedUsers: p.maxSharedUsers,
          icon: p.popular ? "electric_bolt" : "potted_plant",
          popular: p.popular || false,
        }));
      if (packages.length > 0) {
        setCreditPackages(packages);
      }
    }
  }, [plansLoading, plans]);

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "purchase": return "text-success";
      case "bonus": return "text-success";
      case "refund": return "text-success";
      case "burn": return "text-primary";
      default: return "text-on-surface-variant";
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "purchase": return "shopping_cart";
      case "bonus": return "card_giftcard";
      case "refund": return "undo";
      case "burn": return "local_fire_department";
      default: return "bolt";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
        {/* Headline Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-2">Resource Management</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-[#F0F0F0]">Credits & Billing</h2>
          </div>
        </div>

        {/* Current Balance Card */}
        <section className="w-full h-[120px] rounded-xl overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00979D] to-[#007A80]"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="relative h-full flex items-center justify-between px-10">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-white/90 font-medium text-xs tracking-wider uppercase">
                <span className="material-symbols-outlined text-sm">bolt</span>
                Credits Balance
              </div>
              <div className="text-5xl font-black text-white mt-1">
                {profileLoading ? "..." : credits} <span className="text-xl font-normal opacity-70">Credits</span>
              </div>
            </div>
              <Link 
                href={`/dashboard/payment?package=${creditPackages.find(p => p.popular)?.name.toLowerCase() || 'popular'}&type=subscription`} 
                className="px-8 py-3 rounded-lg border-2 border-white text-white font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-[#007A80] transition-all duration-300 transform active:scale-95 shadow-lg"
              >
                Subscribe
              </Link>
          </div>
        </section>

        {/* Active Plan Section */}
        {profile?.plan && profile.plan !== "free" && (
          <section className="bg-surface-container-high rounded-xl p-6 border border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">workspace_premium</span>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-primary">Active Plan</p>
                  <h4 className="text-lg font-bold text-[#F0F0F0]">{profile.plan}</h4>
                  <p className="text-xs text-on-surface-variant">
                    {profile.planStartDate && (
                      <>Started: {formatDate(profile.planStartDate)}</>
                    )}
                    {profile.planEndDate && (
                      <> • Expires: {formatDate(profile.planEndDate)}</>
                    )}
                    {profile.autoRenew && (
                      <span className="text-success ml-2">• Auto-renew enabled</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant">Device Quota</p>
                <p className="text-2xl font-bold text-[#F0F0F0]">{profile.deviceQuota || "Unlimited"}</p>
              </div>
            </div>
          </section>
        )}

        {/* Usage History Section */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold tracking-tight">Recent Activity</h3>
            <div className="h-px flex-1 bg-outline-variant/10"></div>
          </div>
          <div className="bg-surface-container-high rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-highest/50 border-b border-outline-variant/15">
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/80">Date</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/80">Device</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/80">Action</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/80 text-right">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {transactionsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">Loading...</td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">No recent activity</td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-bright transition-colors h-12">
                        <td className="px-6 font-mono text-sm text-[#F0F0F0]">{formatDate(tx.createdAt)}</td>
                        <td className="px-6 text-sm text-[#F0F0F0]">{tx.deviceName || "-"}</td>
                        <td className="px-6 text-sm text-on-surface-variant">
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-sm ${getActionColor(tx.type)}`}>
                              {getActionIcon(tx.type)}
                            </span>
                            {tx.action}
                          </div>
                        </td>
                        <td className={`px-6 text-right font-bold ${tx.credits > 0 ? 'text-success' : 'text-primary'}`}>
                          {tx.credits > 0 ? '+' : ''}{tx.credits}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Credit Packages Section */}
        <section className="pb-16">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-lg font-semibold tracking-tight text-[#F0F0F0]">Buy Credits</h3>
            <div className="h-px flex-1 bg-outline-variant/10"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => (
              <div 
                key={pkg.name}
                className={`bg-surface-container-high rounded-xl p-8 flex flex-col items-center text-center shadow-lg hover:shadow-primary/5 transition-all group ${pkg.popular ? 'ring-2 ring-primary relative' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest rounded-full z-10">
                    Most Popular
                  </div>
                )}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 ${pkg.popular ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-on-surface-variant group-hover:text-primary transition-colors'}`}>
                  <span className="material-symbols-outlined">{pkg.icon}</span>
                </div>
                <h4 className="text-xl font-bold text-[#F0F0F0]">{pkg.name}</h4>
                <p className={`text-sm mt-2 font-mono ${pkg.popular ? 'text-primary' : 'text-on-surface-variant'}`}>{pkg.credits} CREDITS</p>
                <div className="mt-4 space-y-1 text-xs text-on-surface-variant">
                  <p>{pkg.nodes === -1 ? "Unlimited" : pkg.nodes} Devices</p>
                  <p>{pkg.maxSharedUsers === -1 ? "Unlimited" : pkg.maxSharedUsers} Shared Users</p>
                </div>
                <div className="my-4">
                  <span className="text-4xl font-black text-[#F0F0F0]">${pkg.price}</span>
                </div>
                <Link 
                  href={`/dashboard/payment?package=${pkg.name.toLowerCase()}&type=subscription`}
                  className={`w-full py-3 rounded font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all transform active:scale-95 ${pkg.popular ? 'bg-primary text-on-primary shadow-[0_0_20px_rgba(103,215,221,0.3)]' : 'bg-primary-container text-on-primary-container'}`}
                >
                  Subscribe (1 Month)
                </Link>
              </div>
            ))}
          </div>
        </section>
    </div>
  );
}
