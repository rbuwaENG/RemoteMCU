"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const creditPackages = [
  { name: "Starter", credits: 50, price: 2.99 },
  { name: "Popular", credits: 200, price: 9.99 },
  { name: "Pro", credits: 500, price: 19.99 },
];

export default function PaymentPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const packageName = searchParams.get("package") || "popular";

  const selectedPkg = creditPackages.find(p => p.name.toLowerCase() === packageName) || creditPackages[1];

  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [cardDetails, setCardDetails] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle payment processing here
    alert("Payment processing would happen here!");
  };

  return (
    <div className="max-w-6xl mx-auto px-10 py-12">
        {/* Header Section */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#F0F0F0] tracking-tight mb-2">Checkout</h1>
            <p className="text-on-surface-variant font-mono text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Secure Transaction - Encrypted Channel
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
                  <span className="text-xs font-mono text-primary uppercase">Active Selection</span>
                  {selectedPkg.name === "Popular" && (
                    <span className="text-[10px] bg-primary-container text-on-primary-container px-2 py-0.5 rounded font-bold">POPULAR</span>
                  )}
                </div>
                <h4 className="text-lg font-bold text-[#F0F0F0]">{selectedPkg.name} Pack - {selectedPkg.credits} Credits</h4>
                <p className="text-xs text-on-surface-variant mt-1">High-density remote debugging & cloud execution hours.</p>
                <div className="mt-4 text-2xl font-black text-white">${selectedPkg.price}</div>
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
                  <span className="text-2xl font-black text-primary">${selectedPkg.price}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-black py-4 rounded-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                >
                  Complete Payment
                  <span className="material-symbols-outlined text-lg">lock</span>
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
