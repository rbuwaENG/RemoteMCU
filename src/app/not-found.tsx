"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-grow flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-[0.05] pointer-events-none"></div>
        <div className="container mx-auto px-6 py-20 text-center relative z-10">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <span className="material-symbols-outlined text-[120px] text-[#00979D] opacity-20" data-icon="router">router</span>
              <span className="material-symbols-outlined text-[120px] text-[#00979D] absolute inset-0 animate-pulse" data-icon="wifi_off" style={{ fontVariationSettings: "'FILL' 0" }}>wifi_off</span>
            </div>
          </div>
          <h1 className="text-[48px] md:text-[64px] font-bold text-[#00979D] leading-tight font-mono mb-4">
            ERROR_404: RESOURCE_NOT_FOUND
          </h1>
          <div className="inline-flex items-center px-[14px] py-[6px] rounded-[20px] bg-[#2D2D2D] mb-6">
            <span className="text-[14px] font-mono font-semibold text-[#00979D] uppercase tracking-widest glitch-text">0x404</span>
          </div>
          <p className="text-[18px] text-[#A0A0A0] max-w-[540px] mx-auto leading-relaxed mb-10">
            The requested controller node is offline or the link has been decommissioned. Please check your connection parameters.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/" className="h-[48px] px-[32px] bg-[#00979D] text-white text-[16px] font-bold rounded-[6px] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center">
              Back to Home
            </Link>
            <a className="text-[#00979D] text-[14px] font-semibold flex items-center gap-1 hover:gap-2 transition-all group" href="mailto:support@remotemcu.io">
              <span className="material-symbols-outlined text-[18px]">contact_support</span> 
              Contact Support <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
          <div className="pt-16 flex justify-center items-center gap-8 opacity-20 grayscale">
            <div className="flex items-center gap-2 text-xs font-mono"><span className="material-symbols-outlined text-lg">terminal</span> SESSION_TERMINATED</div>
            <div className="flex items-center gap-2 text-xs font-mono"><span className="material-symbols-outlined text-lg">link_off</span> LINK_LOST</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
