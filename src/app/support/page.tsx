"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { useState } from "react";

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I reset my hardware authentication token?",
      answer: 'To reset your hardware token, navigate to Settings > Security > Tokens. Click the "Revoke All" button. Note that this will disconnect all currently active remote bridges until you re-authenticate each device manually.'
    },
    {
      question: "What is the latency limit for real-time debugging?",
      answer: "Remote MCU supports low-latency streaming up to 500ms for stable debugging. For sensitive logic tracking, we recommend using the Local-Buffer Mode which logs data locally on the bridge and uploads in bursts."
    },
    {
      question: "Can I share my Credits with team members?",
      answer: "Yes. Team-based credit sharing is available on our Enterprise and Pro tiers. You can set individual limits per user in the Team Management dashboard."
    }
  ];

  return (
    <>
      <Navbar />
      
      <main className="bg-background text-on-surface font-body selection:bg-primary selection:text-on-primary">
        {/* Hero Section */}
        <section className="relative py-24 px-12 overflow-hidden bg-surface-container-low">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full"></div>
          </div>
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <h1 className="text-5xl font-black tracking-tighter text-on-surface mb-6">
              How can we <span className="text-primary italic">help?</span>
            </h1>
            <p className="text-on-surface-variant text-lg mb-10 max-w-2xl mx-auto">
              Search our knowledge base, explore tutorials, or reach out to our engineering support team directly.
            </p>
            <div className="relative max-w-2xl mx-auto group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
              <input className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary focus:ring-0 text-on-surface pl-12 pr-4 py-5 rounded-sm font-mono text-sm transition-all shadow-xl" placeholder="Search documentation, devices, or errors..." type="text"/>
            </div>
          </div>
        </section>

        {/* Support Categories */}
        <section className="py-20 px-12 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 bg-surface-container-high p-8 rounded-xl border-l-4 border-primary hover:bg-surface-bright transition-all group cursor-pointer">
              <span className="material-symbols-outlined text-primary text-4xl mb-6">rocket_launch</span>
              <h3 className="text-xl font-bold mb-2 text-on-surface uppercase tracking-tight">Getting Started</h3>
              <p className="text-on-surface-variant text-sm mb-4 leading-relaxed">Everything you need to know to set up your first remote MCU bridge and start flashing code.</p>
              <span className="text-xs font-mono text-primary flex items-center group-hover:translate-x-2 transition-transform">EXPLORE GUIDE <span className="material-symbols-outlined text-xs ml-1">arrow_forward</span></span>
            </div>
            <div className="bg-surface-container-high p-8 rounded-xl hover:bg-surface-bright transition-all group cursor-pointer">
              <span className="material-symbols-outlined text-primary text-4xl mb-6">hub</span>
              <h3 className="text-xl font-bold mb-2 text-on-surface uppercase tracking-tight">Device Connectivity</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Troubleshooting WiFi, cellular bridges, and local serial connections.</p>
            </div>
            <div className="bg-surface-container-high p-8 rounded-xl hover:bg-surface-bright transition-all group cursor-pointer">
              <span className="material-symbols-outlined text-primary text-4xl mb-6">code</span>
              <h3 className="text-xl font-bold mb-2 text-on-surface uppercase tracking-tight">Code &amp; Uploading</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Handling binary uploads, OTA updates, and compiler errors.</p>
            </div>
            <div className="bg-surface-container-high p-8 rounded-xl hover:bg-surface-bright transition-all group cursor-pointer">
              <span className="material-symbols-outlined text-primary text-4xl mb-6">receipt_long</span>
              <h3 className="text-xl font-bold mb-2 text-on-surface uppercase tracking-tight">Billing &amp; Credits</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Managing your credit balance, API usage, and enterprise seats.</p>
            </div>
            <div className="md:col-span-3 bg-surface-container-high p-8 rounded-xl flex flex-col md:flex-row items-center gap-8 border border-outline-variant/10">
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-3 text-on-surface uppercase italic">Real-time Terminal Status</h3>
                <p className="text-on-surface-variant text-base mb-4">Check the status of our global relay nodes and compiler servers. Our system is currently operating at 99.9% uptime.</p>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(103,215,221,0.8)]"></div>
                    <span className="text-[10px] font-mono uppercase text-primary">US-EAST-1: ACTIVE</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(103,215,221,0.8)]"></div>
                    <span className="text-[10px] font-mono uppercase text-primary">EU-WEST-2: ACTIVE</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-64 h-32 bg-background rounded-lg p-3 font-mono text-[10px] text-primary/60 overflow-hidden select-none">
                <div className="opacity-80">&gt; PING relay.remotemcu.io...</div>
                <div className="opacity-70">&gt; Response from 142.250.190.46: time=12ms</div>
                <div className="opacity-60">&gt; SYNC_STATUS: OK</div>
                <div className="opacity-50">&gt; THREAD_0: LISTENING</div>
                <div className="opacity-40">&gt; UPTIME: 342:12:05:55</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-surface-container-low px-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="text-xs font-mono text-primary uppercase tracking-[0.3em]">Knowledge Base</span>
                <h2 className="text-4xl font-black text-on-surface uppercase mt-2">Frequently Asked</h2>
              </div>
              <a className="text-primary font-mono text-xs hover:underline" href="#">VIEW ALL QUESTIONS</a>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details 
                  key={index}
                  className="group bg-surface-container-high rounded-xl overflow-hidden transition-all duration-300"
                  open={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <summary className="flex justify-between items-center p-6 cursor-pointer list-none hover:bg-surface-bright transition-colors">
                    <span className="font-bold text-on-surface uppercase tracking-tight text-sm">{faq.question}</span>
                    <span className="material-symbols-outlined text-outline group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <div className="px-6 pb-6 text-on-surface-variant text-sm leading-relaxed border-t border-outline-variant/10 pt-4">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="py-24 px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-8 bg-surface-container rounded-xl border border-outline-variant/20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">chat</span>
              </div>
              <h4 className="text-xl font-bold text-on-surface mb-2 uppercase tracking-tight">Chat with us</h4>
              <p className="text-on-surface-variant text-sm mb-8">Average response time: &lt; 5 minutes. Available 24/7 for Pro members.</p>
              <button className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-lg hover:shadow-[0_0_20px_rgba(103,215,221,0.4)] transition-all">START CHAT</button>
            </div>
            <div className="flex flex-col items-center text-center p-8 bg-surface-container rounded-xl border border-outline-variant/20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">confirmation_number</span>
              </div>
              <h4 className="text-xl font-bold text-on-surface mb-2 uppercase tracking-tight">Open a Ticket</h4>
              <p className="text-on-surface-variant text-sm mb-8">Best for complex technical inquiries requiring engineering review.</p>
              <Link href="/auth" className="w-full py-3 border border-outline-variant text-on-surface font-bold rounded-lg hover:bg-surface-variant transition-all flex items-center justify-center">CREATE TICKET</Link>
            </div>
            <div className="flex flex-col items-center text-center p-8 bg-[#5865F2]/5 rounded-xl border border-[#5865F2]/20">
              <div className="w-16 h-16 bg-[#5865F2]/20 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#5865F2] text-3xl">groups</span>
              </div>
              <h4 className="text-xl font-bold text-on-surface mb-2 uppercase tracking-tight">Discord Community</h4>
              <p className="text-on-surface-variant text-sm mb-8">Join 15,000+ engineers sharing snippets and hardware hacks.</p>
              <button className="w-full py-3 bg-[#5865F2] text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center space-x-2">
                <span>JOIN DISCORD</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
