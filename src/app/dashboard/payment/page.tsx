"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { addCredits } from "@/lib/firestore/credits";
import { applyPlan } from "@/lib/firestore/users";
import { usePlans } from "@/lib/hooks/usePlans";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

export default function PaymentPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { plans, loading: plansLoading } = usePlans();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const packageName = searchParams.get("package") || "popular";
  const isSubscription = searchParams.get("type") === "subscription";

  const selectedPlan = plans.find(p => p.id.toLowerCase() === packageName.toLowerCase());
  const selectedPkg = selectedPlan ? {
    name: selectedPlan.name.replace(" Tier", ""),
    credits: selectedPlan.credits,
    price: selectedPlan.price
  } : { name: "Popular", credits: 200, price: 9.99 };

  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [cardDetails, setCardDetails] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: ""
  });
  const [processing, setProcessing] = useState(false);

  const isFreePlan = selectedPlan && selectedPlan.price === 0;
  const needsPayment = !isFreePlan;

  // Check if renewal is allowed for free plan
  const canRenewFree = (() => {
    if (!isFreePlan || !profile || profile.plan?.toLowerCase() !== 'free') return true;
    if (!profile.planStartDate) return true;
    
    const startDate = profile.planStartDate.toDate ? profile.planStartDate.toDate() : new Date(profile.planStartDate);
    const now = new Date();
    const diffDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 30;
  })();

  const nextRenewalDate = (() => {
    if (canRenewFree || !profile?.planStartDate) return null;
    const startDate = profile.planStartDate.toDate ? profile.planStartDate.toDate() : new Date(profile.planStartDate);
    return new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || plansLoading) return;
    
    setProcessing(true);
    try {
      if (isSubscription && selectedPlan) {
        await applyPlan(user.uid, {
          id: selectedPlan.id,
          name: selectedPlan.name,
          credits: selectedPlan.credits,
          price: selectedPlan.price,
          nodes: selectedPlan.nodes
        }, "monthly");
        alert(`Successfully subscribed to ${selectedPlan.name}! Your plan is active for 1 month.`);
      } else {
        await addCredits(user.uid, selectedPkg.credits, "purchase", `Purchased ${selectedPkg.credits} credits`);
        alert(`Successfully added ${selectedPkg.credits} credits to your account!`);
      }
      router.push("/dashboard/credits");
    } catch (error: any) {
      console.error("Failed to process:", error);
      alert(error.message || "Failed to process. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (isFreePlan) {
    return (
      <div className="max-w-6xl mx-auto px-10 py-12">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#F0F0F0] tracking-tight mb-2">Subscribe to Free Plan</h1>
            <p className="text-on-surface-variant font-mono text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              No Payment Required
            </p>
          </div>
          <Link href="/dashboard/credits" className="text-sm font-medium text-outline flex items-center gap-1 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Billing
          </Link>
        </div>

        <div className="bg-surface-container-high rounded-xl p-8 max-w-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-success text-3xl">check_circle</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#F0F0F0]">{selectedPlan?.name || "Free Plan"}</h3>
              <p className="text-sm text-on-surface-variant">{selectedPlan?.credits || 0} credits • {selectedPlan?.nodes || 3} devices</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Plan Price</span>
              <span className="font-mono text-success">Free</span>
            </div>
            <div className="h-px bg-outline-variant opacity-20"></div>
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-white">Total Due</span>
              <span className="text-2xl font-black text-success">FREE</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={processing || !canRenewFree}
            className="w-full bg-success text-[#003739] font-black py-4 rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? "Processing..." : canRenewFree ? "Activate Free Plan" : "Renewal Not Available Yet"}
          </button>

          {!canRenewFree && nextRenewalDate && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">info</span>
              <p className="text-xs text-[#F0F0F0] leading-relaxed">
                You can only renew the Free Plan once every 30 days. 
                Your next renewal will be available on <span className="text-primary font-bold">{nextRenewalDate.toLocaleDateString()}</span>.
              </p>
            </div>
          )}

          <p className="text-xs text-on-surface-variant text-center mt-4">
            This plan renews automatically every month. Cancel anytime.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-10 py-12">
        {/* Header Section */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#F0F0F0] tracking-tight mb-2">
              {needsPayment ? "Checkout" : "Subscribe"}
            </h1>
            <p className="text-on-surface-variant font-mono text-xs uppercase tracking-widest flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${needsPayment ? 'bg-primary' : 'bg-success'}`}></span>
              {needsPayment ? "Secure Transaction - Encrypted Channel" : "Free Plan Activation"}
            </p>
          </div>
          <Link href="/dashboard/credits" className="text-sm font-medium text-outline flex items-center gap-1 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Billing
          </Link>
        </div>

        {/* Two-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Payment Form */}
          <div className="lg:col-span-7 space-y-8">
            {/* Payment Method Toggle */}
            <section>
              <h3 className="text-xs font-mono text-primary mb-4 uppercase tracking-tighter">01. Payment Method</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="cursor-pointer group">
                  <input
                    checked={paymentMethod === "credit_card"}
                    className="hidden peer"
                    name="payment_type"
                    type="radio"
                    onChange={() => setPaymentMethod("credit_card")}
                  />
                  <div className="p-4 bg-surface-container-low border border-transparent peer-checked:border-primary peer-checked:bg-surface-container-high rounded-xl transition-all flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">credit_card</span>
                    <span className="text-sm font-semibold">Credit Card</span>
                  </div>
                </label>
                <label className="cursor-pointer group">
                  <input
                    className="hidden peer"
                    name="payment_type"
                    type="radio"
                    onChange={() => setPaymentMethod("paypal")}
                  />
                  <div className="p-4 bg-surface-container-low border border-transparent peer-checked:border-primary peer-checked:bg-surface-container-high rounded-xl transition-all flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">account_balance_wallet</span>
                    <span className="text-sm font-semibold">Paypal</span>
                  </div>
                </label>
              </div>
            </section>

            {/* Form Fields */}
            <section className="space-y-6">
              <h3 className="text-xs font-mono text-primary mb-2 uppercase tracking-tighter">02. Card Details</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-mono text-on-surface-variant uppercase mb-1 ml-1">Cardholder Name</label>
                  <input
                    className="w-full bg-[#1b1b1c] border border-outline-variant rounded-lg px-4 py-3 text-[#F0F0F0] font-mono text-sm tracking-widest placeholder:opacity-30"
                    placeholder="ALEXANDER STERLING"
                    type="text"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-mono text-on-surface-variant uppercase mb-1 ml-1">Card Number</label>
                  <div className="relative">
                    <input
                      className="w-full bg-[#1b1b1c] border border-outline-variant rounded-lg px-4 py-3 text-[#F0F0F0] font-mono text-sm tracking-widest placeholder:opacity-30"
                      placeholder=".... .... .... ...."
                      type="text"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-mono text-on-surface-variant uppercase mb-1 ml-1">Expiration Date</label>
                    <input
                      className="w-full bg-[#1b1b1c] border border-outline-variant rounded-lg px-4 py-3 text-[#F0F0F0] font-mono text-sm tracking-widest placeholder:opacity-30 text-center"
                      placeholder="MM / YY"
                      type="text"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-mono text-on-surface-variant uppercase mb-1 ml-1">CVV / CVC</label>
                    <input
                      className="w-full bg-[#1b1b1c] border border-outline-variant rounded-lg px-4 py-3 text-[#F0F0F0] font-mono text-sm tracking-widest placeholder:opacity-30 text-center"
                      placeholder="..."
                      type="password"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    />
                  </div>
                </div>
              </form>
            </section>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#2a2a2a] rounded-xl p-8 shadow-2xl relative overflow-hidden" style={{ background: 'rgba(42, 42, 42, 0.8)', backdropFilter: 'blur(20px)' }}>
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <span className="material-symbols-outlined text-8xl">terminal</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Order Summary
              </h3>

              {/* Package Details */}
              <div className="bg-surface-container-lowest rounded-lg p-5 mb-8 border-l-2 border-primary">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-primary uppercase">
                    {isSubscription ? "Monthly Subscription" : "Credit Package"}
                  </span>
                  {selectedPlan?.popular && (
                    <span className="text-[10px] bg-primary-container text-on-primary-container px-2 py-0.5 rounded font-bold">POPULAR</span>
                  )}
                </div>
                <h4 className="text-lg font-bold text-[#F0F0F0]">
                  {selectedPkg.name} {isSubscription ? "Plan" : "Pack"} - {selectedPkg.credits} Credits
                </h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  {isSubscription 
                    ? `Monthly plan with ${selectedPkg.credits} credits. Auto-renews every 30 days.`
                    : "High-density remote debugging & cloud execution hours."}
                </p>
                <div className="mt-4 text-2xl font-black text-white">${selectedPkg.price}
                  {isSubscription && <span className="text-sm font-normal text-on-surface-variant">/month</span>}
                </div>
              </div>

              {/* Calculations */}
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span className="font-mono">${selectedPkg.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Tax (0%)</span>
                  <span className="font-mono">$0.00</span>
                </div>
                <div className="h-px bg-outline-variant opacity-20 my-2"></div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-bold text-white uppercase tracking-tighter">Total Due</span>
                  <span className="text-2xl font-black text-primary">${selectedPkg.price}{isSubscription && <span className="text-sm font-normal">/mo</span>}</span>
                </div>
                {isSubscription && (
                  <div className="flex items-center gap-2 text-xs text-success mt-2">
                    <span className="material-symbols-outlined text-sm">autorenew</span>
                    Auto-renews every 30 days. Cancel anytime.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <button
                  onClick={handleSubmit}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-black py-4 rounded-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      Complete Payment
                      <span className="material-symbols-outlined text-lg">lock</span>
                    </>
                  )}
                </button>
                <Link href="/dashboard/credits" className="w-full py-2 text-xs font-medium text-[#A0A0A0] hover:text-white transition-colors flex items-center justify-center gap-1 group">
                  Cancel and go back
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">chevron_right</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-outline-variant border-opacity-20 grid grid-cols-3 gap-2 opacity-50">
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="material-symbols-outlined text-lg">shield_with_heart</span>
                  <span className="text-[8px] font-mono uppercase">Secure</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="material-symbols-outlined text-lg">speed</span>
                  <span className="text-[8px] font-mono uppercase">Instant</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="material-symbols-outlined text-lg">history</span>
                  <span className="text-[8px] font-mono uppercase">Logs</span>
                </div>
              </div>
            </div>

            {/* Side Note */}
            <div className="mt-6 px-4">
              <p className="text-[11px] text-on-surface-variant font-mono leading-relaxed italic opacity-60">
                * Credits are valid for 12 months from the date of purchase and can be used across all Remote MCU compatible hardware clusters.
              </p>
            </div>
          </div>
        </div>
    </div>
  );
}
