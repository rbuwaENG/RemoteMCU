"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { doc, updateDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePlans } from "@/lib/hooks/usePlans";
import { useAdminStats } from "@/lib/hooks/useAdminStats";
import { useCreditBurnRates } from "@/lib/hooks/useCreditBurnRates";
import { getRecentAdminLogs, createAdminLog, AdminLog } from "@/lib/firestore/adminLogs";

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  nodes: number;
  features: string[];
  popular?: boolean;
  active?: boolean;
  showOnLanding?: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  applicablePlans: string[];
  maxRedemptions: number;
  redemptionCount: number;
  status: "active" | "paused" | "expired";
}

interface CreditBurnRate {
  id: string;
  name: string;
  description: string;
  creditsPerUnit: number;
  unit: string;
  category: "upload" | "serial" | "camera" | "api" | "storage";
  active: boolean;
}

export default function PlanManagementPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { plans, loading: plansLoading } = usePlans();
  const { stats, monthlyRevenue } = useAdminStats();
  const { rates: creditBurnRates, loading: burnRatesLoading } = useCreditBurnRates();
  
  const [plansData, setPlansData] = useState<Plan[]>([
    { id: "free", name: "Free Tier", price: 0, credits: 10, nodes: 3, features: ["Public Access"], active: true },
    { id: "starter", name: "Starter Tier", price: 2.99, credits: 50, nodes: 10, features: ["Basic OTA"], active: true },
    { id: "popular", name: "Pro Tier", price: 9.99, credits: 200, nodes: -1, features: ["Fast OTA", "Priority Support"], popular: true, active: true },
    { id: "pro", name: "Enterprise Tier", price: 19.99, credits: 500, nodes: -1, features: ["All Features"], active: true },
  ]);
  
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AdminLog[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: 0,
    credits: 50,
    nodes: 10,
    features: ""
  });

  const [editPlan, setEditPlan] = useState({
    name: "",
    price: 0,
    credits: 50,
    nodes: 10,
    features: ""
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (!plansLoading && plans.length > 0) {
      setPlansData(plans);
    }
  }, [plansLoading, plans]);

  useEffect(() => {
    const fetchPromoCodes = async () => {
      try {
        const promoRef = collection(db, "promoCodes");
        const promoSnap = await getDocs(promoRef);
        const codes = promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PromoCode[];
        setPromoCodes(codes);
      } catch (error) {
        console.error("Failed to fetch promo codes:", error);
      }
    };
    fetchPromoCodes();
  }, []);

  const handleSavePlan = async (planId: string, updatedPlan: Partial<Plan>) => {
    setSaving(true);
    try {
      const planRef = doc(db, "plans", "default");
      const updatedPlans = plansData.map(p => p.id === planId ? { ...p, ...updatedPlan } : p);
      await setDoc(planRef, { plans: updatedPlans }, { merge: true });
      
      if (user) {
        await createAdminLog(
          user.uid,
          user.displayName || user.email || "Admin",
          "UPDATE_PLAN",
          "plans",
          planId,
          `Updated plan: ${updatedPlan.name || planId}`,
          "committed"
        );
      }
    } catch (error) {
      console.error("Failed to save plan:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.name.trim()) return;
    
    const planId = newPlan.name.toLowerCase().replace(/\s+/g, "-");
    const newPlanData: Plan = {
      id: planId,
      name: newPlan.name,
      price: newPlan.price,
      credits: newPlan.credits,
      nodes: newPlan.nodes,
      features: newPlan.features.split(",").map(f => f.trim()).filter(f => f),
      active: true,
    };
    
    const updatedPlans = [...plansData, newPlanData];
    setPlansData(updatedPlans);
    
    try {
      const planRef = doc(db, "plans", "default");
      await setDoc(planRef, { plans: updatedPlans }, { merge: true });
      
      if (user) {
        await createAdminLog(
          user.uid,
          user.displayName || user.email || "Admin",
          "CREATE_PLAN",
          "plans",
          planId,
          `Created plan: ${newPlan.name}`,
          "committed"
        );
      }
      
      setShowNewPlanModal(false);
      setNewPlan({ name: "", price: 0, credits: 50, nodes: 10, features: "" });
    } catch (error) {
      console.error("Failed to create plan:", error);
    }
  };

  const handleSaveEditPlan = async () => {
    if (!editingPlan) return;
    
    const updatedPlans = plansData.map(p => 
      p.id === editingPlan.id 
        ? { ...p, name: editPlan.name, price: editPlan.price, credits: editPlan.credits, nodes: editPlan.nodes, features: editPlan.features.split(",").map(f => f.trim()).filter(f => f) }
        : p
    );
    setPlansData(updatedPlans);
    
    try {
      const planRef = doc(db, "plans", "default");
      await setDoc(planRef, { plans: updatedPlans }, { merge: true });
      
      if (user) {
        await createAdminLog(
          user.uid,
          user.displayName || user.email || "Admin",
          "UPDATE_PLAN",
          "plans",
          editingPlan.id,
          `Edited plan: ${editPlan.name}`,
          "committed"
        );
      }
      
      setEditingPlan(null);
      setEditPlan({ name: "", price: 0, credits: 50, nodes: 10, features: "" });
    } catch (error) {
      console.error("Failed to save plan:", error);
    }
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setEditPlan({
      name: plan.name,
      price: plan.price,
      credits: plan.credits,
      nodes: plan.nodes,
      features: plan.features.join(", ")
    });
  };

  const handleViewAuditLogs = async () => {
    setShowAuditLog(true);
    try {
      const logs = await getRecentAdminLogs(50);
      setAuditLogs(logs);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    }
  };

  const handleExportData = () => {
    const data = {
      plans: plansData,
      promoCodes: promoCodes,
      stats: stats,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `remotemcu-plans-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCreditBurnRate = async (rateId: string, data: Partial<CreditBurnRate>) => {
    try {
      const { updateCreditBurnRate } = await import("@/lib/firestore/plans");
      await updateCreditBurnRate(rateId, data);
    } catch (error) {
      console.error("Failed to update credit burn rate:", error);
    }
  };

  const handleToggleCreditBurnRate = async (rateId: string, active: boolean) => {
    try {
      const { updateCreditBurnRates } = await import("@/lib/firestore/plans");
      const newRates = creditBurnRates.map(r => 
        r.id === rateId ? { ...r, active } : r
      );
      await updateCreditBurnRates(newRates);
    } catch (error) {
      console.error("Failed to toggle credit burn rate:", error);
    }
  };

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Plan & Offer Management</h1>
          <p className="text-on-surface-variant max-w-2xl font-light">
            Configure deployment tiers, operational limits, and promotional logic for the global MCU network.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleViewAuditLogs}
            className="px-5 py-2.5 bg-surface-container-high text-on-surface text-sm font-semibold rounded hover:brightness-125 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">history</span>
            Audit Logs
          </button>
          <button 
            onClick={handleExportData}
            className="px-5 py-2.5 bg-surface-container-high text-on-surface text-sm font-semibold rounded hover:brightness-125 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export
          </button>
          <button 
            onClick={() => setShowNewPlanModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary text-sm font-bold rounded shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create New Plan
          </button>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
            <h3 className="text-lg font-bold text-on-surface tracking-tight mb-6">Subscription Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plansData.map((plan) => {
                return (
                  <div
                    key={plan.id}
                    className={`bg-surface-container-low rounded-xl p-6 border ${
                      plan.popular ? "border-primary/20 shadow-[0_0_40px_rgba(103,215,221,0.05)]" : "border-outline-variant/5"
                    } hover:border-outline-variant/20 transition-all group relative overflow-hidden`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-on-primary text-[10px] font-black uppercase tracking-widest">
                        Most Popular
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
                          {plan.name}
                          {plan.popular && (
                            <span className="material-symbols-outlined text-primary text-base">verified</span>
                          )}
                        </h3>
                        <p className="text-xs font-mono text-primary/60 uppercase mt-1">Tier ID: MCU-{plan.id.toUpperCase()}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500">Popular</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={plan.popular || false}
                              onChange={() => handleSavePlan(plan.id, { popular: !plan.popular })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500">Show on Landing</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={plan.showOnLanding !== false}
                              onChange={() => handleSavePlan(plan.id, { showOnLanding: plan.showOnLanding === false ? true : false })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500">Active</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={plan.active}
                              onChange={() => handleSavePlan(plan.id, { active: !plan.active })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1.5">Monthly Price (USD)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm">$</span>
                          <input
                            className="w-full bg-surface-container-high border-b border-zinc-700 py-2 pl-7 pr-4 text-on-surface text-sm focus:border-primary transition-colors focus:ring-0"
                            type="number"
                            step="0.01"
                            value={plan.price}
                            onChange={(e) => handleSavePlan(plan.id, { price: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1.5">Credits</label>
                          <input
                            className="w-full bg-surface-container-high border-b border-zinc-700 py-2 px-3 text-on-surface text-sm focus:border-primary transition-colors focus:ring-0"
                            type="number"
                            value={plan.credits}
                            onChange={(e) => handleSavePlan(plan.id, { credits: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1.5">Devices</label>
                          <input
                            className="w-full bg-surface-container-high border-b border-zinc-700 py-2 px-3 text-on-surface text-sm focus:border-primary transition-colors focus:ring-0"
                            type="number"
                            value={plan.nodes === -1 ? "Unlimited" : plan.nodes}
                            onChange={(e) => handleSavePlan(plan.id, { nodes: e.target.value === "Unlimited" ? -1 : parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-2">Features</label>
                        <div className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-on-surface">
                              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-outline-variant/10">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="w-full px-4 py-2 bg-surface-container-high text-on-surface text-sm font-semibold rounded hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Edit Plan
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
              <div>
                <h3 className="text-lg font-bold text-on-surface tracking-tight">Credit Burn Rates</h3>
                <p className="text-xs text-on-surface-variant">Configure how credits are consumed for each platform operation.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {creditBurnRates.map((rate) => (
                <div key={rate.id} className="bg-surface-container-high rounded-lg p-4 border border-outline-variant/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">{rate.name}</h4>
                      <p className="text-[10px] text-on-surface-variant">{rate.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rate.active}
                        onChange={(e) => handleToggleCreditBurnRate(rate.id, e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Credits</label>
                      <input
                        className="w-full bg-surface-container-low border-b border-zinc-700 py-1 px-2 text-on-surface text-sm focus:border-primary transition-colors focus:ring-0"
                        type="number"
                        step="0.1"
                        value={rate.creditsPerUnit}
                        onChange={(e) => handleSaveCreditBurnRate(rate.id, { creditsPerUnit: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="px-2 py-1 bg-primary/10 rounded text-xs text-primary font-mono">
                      {rate.creditsPerUnit} cr
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${
                      rate.category === 'upload' ? 'bg-blue-500/20 text-blue-400' :
                      rate.category === 'serial' ? 'bg-green-500/20 text-green-400' :
                      rate.category === 'camera' ? 'bg-purple-500/20 text-purple-400' :
                      rate.category === 'api' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {rate.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
              <div>
                <h3 className="text-lg font-bold text-on-surface tracking-tight">Active Promotional Offers</h3>
                <p className="text-xs text-on-surface-variant">Manage discount codes and seasonal pricing adjustments.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface-container-lowest text-[10px] font-mono text-zinc-500 uppercase">
                    <th className="px-6 py-4">Offer Code</th>
                    <th className="px-6 py-4">Reduction</th>
                    <th className="px-6 py-4">Redemptions</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {promoCodes.length > 0 ? promoCodes.map((offer) => (
                    <tr key={offer.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-primary">{offer.code}</td>
                      <td className="px-6 py-4">
                        {offer.discountType === "percentage" ? `${offer.discountValue}% OFF` : `$${offer.discountValue} OFF`}
                      </td>
                      <td className="px-6 py-4">{offer.redemptionCount} / {offer.maxRedemptions}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs ${offer.status === "active" ? "text-green-400" : "text-zinc-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${offer.status === "active" ? "bg-green-400" : "bg-zinc-600"}`}></span>
                          {offer.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-white/40">No promo codes found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">analytics</span>
              Revenue Analysis
            </h3>
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-2xl font-black text-on-surface">${monthlyRevenue.toFixed(2) || "0.00"}</span>
                <span className="text-xs text-on-surface-variant font-mono">Total</span>
              </div>
              <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-tighter">
                Monthly Revenue
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                <span className="text-xs text-on-surface-variant">Total Users</span>
                <span className="text-sm font-bold text-on-surface">{stats?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                <span className="text-xs text-on-surface-variant">Active Devices</span>
                <span className="text-sm font-bold text-on-surface">{stats?.activeDevices || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                <span className="text-xs text-on-surface-variant">Total Devices</span>
                <span className="text-sm font-bold text-on-surface">{stats?.totalDevices || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-on-surface-variant">Daily Sessions</span>
                <span className="text-sm font-bold text-on-surface">{stats?.dailySessions || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNewPlanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#2D2D2D] w-full max-w-md rounded-lg border border-[#3C3C3C] shadow-2xl p-6">
            <h3 className="text-lg font-bold text-on-surface mb-4">Create New Plan</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Plan Name</label>
                <input
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                  placeholder="e.g. Team Tier"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-on-surface-variant uppercase">Price ($)</label>
                  <input
                    className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                    type="number"
                    step="0.01"
                    placeholder="9.99"
                    value={newPlan.price || ""}
                    onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-on-surface-variant uppercase">Credits</label>
                  <input
                    className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                    type="number"
                    placeholder="100"
                    value={newPlan.credits || ""}
                    onChange={(e) => setNewPlan({ ...newPlan, credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Device Limit</label>
                <input
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                  type="number"
                  placeholder="-1 for unlimited"
                  value={newPlan.nodes || ""}
                  onChange={(e) => setNewPlan({ ...newPlan, nodes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Features (comma separated)</label>
                <input
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                  placeholder="Feature 1, Feature 2"
                  value={newPlan.features}
                  onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowNewPlanModal(false); setNewPlan({ name: "", price: 0, credits: 50, nodes: 10, features: "" }); }}
                  className="flex-1 px-4 py-2 border border-white/10 text-white/60 rounded hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlan}
                  className="flex-1 px-4 py-2 bg-primary text-on-primary font-bold rounded hover:brightness-110 transition-all"
                >
                  Create Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#2D2D2D] w-full max-w-md rounded-lg border border-[#3C3C3C] shadow-2xl p-6">
            <h3 className="text-lg font-bold text-on-surface mb-4">Edit Plan</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Plan Name</label>
                <input
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                  placeholder="e.g. Team Tier"
                  value={editPlan.name}
                  onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-on-surface-variant uppercase">Price ($)</label>
                  <input
                    className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                    type="number"
                    step="0.01"
                    placeholder="9.99"
                    value={editPlan.price || ""}
                    onChange={(e) => setEditPlan({ ...editPlan, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-on-surface-variant uppercase">Credits</label>
                  <input
                    className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                    type="number"
                    placeholder="100"
                    value={editPlan.credits || ""}
                    onChange={(e) => setEditPlan({ ...editPlan, credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Device Limit</label>
                <input
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                  type="number"
                  placeholder="-1 for unlimited"
                  value={editPlan.nodes || ""}
                  onChange={(e) => setEditPlan({ ...editPlan, nodes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Features (comma separated)</label>
                <input
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                  placeholder="Feature 1, Feature 2"
                  value={editPlan.features}
                  onChange={(e) => setEditPlan({ ...editPlan, features: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setEditingPlan(null); setEditPlan({ name: "", price: 0, credits: 50, nodes: 10, features: "" }); }}
                  className="flex-1 px-4 py-2 border border-white/10 text-white/60 rounded hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditPlan}
                  className="flex-1 px-4 py-2 bg-primary text-on-primary font-bold rounded hover:brightness-110 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuditLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#2D2D2D] w-full max-w-4xl max-h-[80vh] rounded-lg border border-[#3C3C3C] shadow-2xl p-6 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-on-surface">Admin Audit Logs</h3>
              <button onClick={() => setShowAuditLog(false)} className="text-white/60 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface-container-lowest text-[10px] font-mono text-zinc-500 uppercase sticky top-0">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {auditLogs.length > 0 ? auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-white/60">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'N/A'}</td>
                      <td className="px-4 py-3 text-xs">{log.adminName}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/80">{log.entity}/{log.entityId}</td>
                      <td className="px-4 py-3 text-xs text-white/60">{log.description}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-white/40">No audit logs found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}