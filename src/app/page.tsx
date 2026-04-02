"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSiteContent } from "@/lib/hooks/useSiteContent";
import { usePlans } from "@/lib/hooks/usePlans";
import { useAuth } from "@/hooks/useAuth";
import { createSupportTicket } from "@/lib/firestore/support";

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

export default function Home() {
  const { user } = useAuth();
  const { content, loading: contentLoading } = useSiteContent();
  const { plans: firestorePlans, loading: plansLoading } = usePlans();
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "", category: "technical" as const });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitTicket = async () => {
    if (!user || !ticketForm.subject || !ticketForm.description) return;
    
    setSubmitting(true);
    try {
      await createSupportTicket({
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || user.email?.split("@")[0] || "User",
        subject: ticketForm.subject,
        description: ticketForm.description,
        category: ticketForm.category,
        priority: "medium",
        status: "open",
      });
      setShowTicketModal(false);
      setTicketForm({ subject: "", description: "", category: "technical" });
      alert("Ticket submitted successfully!");
    } catch (err) {
      console.error("Error submitting ticket:", err);
      alert("Failed to submit ticket. Please try again.");
    }
    setSubmitting(false);
  };

  const heroTitle = content?.hero?.title || "Debug Your Hardware. From Anywhere.";
  const heroSubtext = content?.hero?.subtext || "Upload code, monitor serial output, and watch live camera feeds on your ESP32, Arduino, or any MCU — remotely.";
  const features = content?.features || [
    { title: "Remote Code Upload", description: "Secure Over-The-Air (OTA) flashing. Push your compiled binaries directly to your devices through our encrypted tunnel.", icon: "cloud_upload" },
    { title: "Live Serial Monitor", description: "Real-time bidirectional communication. Debug variables and send commands through a web-based serial terminal with zero latency.", icon: "terminal" },
    { title: "Camera Debug Feed", description: "Visualize your hardware environment. Integrated support for ESP32-CAM and external USB modules to see what your device sees.", icon: "videocam" },
  ];
  const architects = content?.architects || [];
  const mission = content?.about?.mission || "Remote MCU was forged in the labs of hardware developers who grew tired of long-distance hardware debugging. Our mission is to democratize remote physical interaction—enabling engineers to innovate without geographical constraints.";
  const discordLink = content?.socialLinks?.discord || "https://discord.gg/remotemcu";
  const buyMeACoffeeLink = content?.socialLinks?.buymeacoffee || "https://buymeacoffee.com/remotemcu";

  const defaultPlans: Plan[] = [];

  const plans = !plansLoading && firestorePlans.length > 0
    ? firestorePlans.filter((p: Plan) => p.active && p.showOnLanding).sort((a: Plan, b: Plan) => a.price - b.price)
    : defaultPlans.filter(p => p.showOnLanding);

  const showLoading = contentLoading || plansLoading;

  return (
    <>
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-56px)] bg-[#1E1E1E] relative overflow-hidden flex items-center">
          <div className="absolute inset-0 dot-grid opacity-[0.05] pointer-events-none"></div>
          <div className="container mx-auto px-6 grid md:grid-cols-10 gap-12 py-20 items-center relative z-10">
            {/* Left Column (55%) */}
            <div className="md:col-span-6 space-y-6">
              <div className="inline-flex items-center px-[14px] py-[6px] rounded-[20px] bg-[#2D2D2D]">
                <span className="text-[12px] font-semibold text-[#00979D] uppercase tracking-wide">Open Source Remote Debugging Tool</span>
              </div>
              <h1 className="text-[42px] font-bold text-[#F0F0F0] leading-[1.2] max-w-xl">
                {showLoading ? "Loading..." : heroTitle}
              </h1>
              <p className="text-[16px] text-[#A0A0A0] max-w-[480px] leading-relaxed">
                {heroSubtext}
              </p>
              <div className="flex items-center pt-4">
                <Link href="/auth" className="h-[48px] px-[32px] bg-[#00979D] text-white text-[16px] font-bold rounded-[6px] hover:brightness-110 active:scale-95 transition-all flex items-center">
                  Get Started Free
                </Link>
                <Link href={user ? "/dashboard" : "/guide"} className="text-[#00979D] text-[14px] font-semibold ml-[24px] flex items-center gap-1 hover:gap-2 transition-all group">
                  See how it works <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
              <div className="pt-8 flex items-center gap-8 opacity-40 grayscale">
                <div className="flex items-center gap-2 text-xs font-mono"><span className="material-symbols-outlined text-lg">developer_board</span> ESP32</div>
                <div className="flex items-center gap-2 text-xs font-mono"><span className="material-symbols-outlined text-lg">settings_input_component</span> Arduino</div>
                <div className="flex items-center gap-2 text-xs font-mono"><span className="material-symbols-outlined text-lg">memory</span> STM32</div>
              </div>
            </div>
            {/* Right Column (45%) */}
            <div className="md:col-span-4 relative group">
              <div className="relative bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden mockup-glow transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
                {/* Browser Header */}
                <div className="bg-[#252526] flex items-center px-4 py-3 gap-2 border-b border-[#3d494a]/30">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></div>
                  </div>
                  <div className="mx-auto bg-black/20 px-4 py-1 rounded text-[10px] font-mono text-on-surface-variant/60 w-1/2 text-center">
                    remotemcu.io/device/hydra-node-04
                  </div>
                </div>
                {/* Mockup Content */}
                <div className="bg-background flex h-[420px] text-[11px]">
                  {/* Sidebar Mock */}
                  <div className="w-[60px] bg-[#252526] border-r border-outline-variant/10 flex flex-col items-center py-4 gap-4">
                    <div className="w-8 h-8 bg-[#00979D] rounded flex items-center justify-center"><span className="material-symbols-outlined text-white text-lg">hub</span></div>
                    <span className="material-symbols-outlined text-on-surface-variant/40">dashboard</span>
                    <span className="material-symbols-outlined text-[#00979D]">developer_board</span>
                    <span className="material-symbols-outlined text-on-surface-variant/40">payments</span>
                  </div>
                  {/* IDE/Control Mock */}
                  <div className="flex-grow flex flex-col">
                    {/* IDE Area */}
                    <div className="flex-grow bg-[#131313] p-4 font-mono text-[10px] overflow-hidden leading-tight">
                      <div className="flex gap-2">
                        <div className="text-on-surface-variant/20 text-right">1<br />2<br />3<br />4<br />5<br />6<br />7</div>
                        <div className="text-on-surface-variant/80">
                          <span className="arduino-comment">// Remote MCU Control</span><br />
                          <span className="arduino-keyword">#include</span> <span className="arduino-literal">&lt;WiFi.h&gt;</span><br />
                          <span className="arduino-keyword">void</span> <span className="arduino-function">setup</span>() {"{"}<br />
                          {"  "}Serial.<span className="arduino-function">begin</span>{"(115200)"};<br />
                          {"  "}WiFi.<span className="arduino-function">begin</span>{"(\"IoT_Net\")"};<br />
                          {"}"}<br />
                          <span className="arduino-keyword">void</span> <span className="arduino-function">loop</span>() {"{ ... }"}
                        </div>
                      </div>
                    </div>
                    {/* Camera/Serial Split */}
                    <div className="h-[180px] border-t border-outline-variant/20 flex">
                      <div className="w-1/2 relative bg-black">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] flex items-center justify-center">
                          <span className="material-symbols-outlined text-white/20 text-6xl">videocam</span>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/60 px-1 rounded text-[8px] flex items-center gap-1 border border-red-500/30">
                          <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div> LIVE
                        </div>
                      </div>
                      <div className="w-1/2 bg-[#0c0c0c] p-2 font-mono text-[9px] text-[#4CAF50] overflow-hidden">
                        <p className="opacity-40">[0.00] initializing...</p>
                        <p>[1.89] wifi connected</p>
                        <p>[2.54] temp=24.5C</p>
                        <p className="animate-pulse">[5.01] heart pulse sent</p>
                      </div>
                    </div>
                    {/* Bottom Actions */}
                    <div className="h-10 bg-surface-container-low border-t border-outline-variant/10 flex items-center px-3 justify-between">
                      <div className="flex gap-2">
                        <div className="px-2 py-0.5 bg-[#00979D] rounded text-[9px] font-bold text-white uppercase">Upload</div>
                        <div className="px-2 py-0.5 border border-[#00979D]/30 rounded text-[9px] font-bold text-[#00979D] uppercase">Verify</div>
                      </div>
                      <div className="text-[8px] text-on-surface-variant/40">ESP32-WROOM-32 @ 115200</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="bg-surface-container-low py-24 relative">
          <div className="container mx-auto px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold text-[#F0F0F0] mb-4">Engineered for Reliability</h2>
              <div className="h-1 w-12 bg-primary mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <div key={idx} className="p-8 bg-surface-container-high border border-outline-variant/20 rounded-xl hover:border-primary/40 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-primary group-hover:text-on-primary">{feature.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface mb-3">{feature.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section className="bg-[#252526] py-24" id="about">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center mb-20">
              <h2 className="text-[12px] font-semibold text-[#00979D] uppercase tracking-widest mb-4">Our Core Directives</h2>
              <h3 className="text-3xl font-bold text-[#F0F0F0] mb-8 italic">&quot;Mission Protocol&quot;</h3>
              <p className="text-[18px] text-on-surface-variant leading-relaxed font-mono">
                {mission}
              </p>
            </div>
            <div className="mt-20">
              <h4 className="text-2xl font-bold text-center text-[#F0F0F0] mb-12">Meet the Team</h4>
              {showLoading ? (
                <div className="flex gap-12 flex-wrap justify-center">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="text-center">
                      <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-surface-container-high animate-pulse"></div>
                      <div className="h-5 w-32 bg-surface-container-high rounded mx-auto mb-2 animate-pulse"></div>
                      <div className="h-4 w-24 bg-surface-container-high rounded mx-auto mb-4 animate-pulse"></div>
                      <div className="h-4 w-48 bg-surface-container-high rounded mx-auto animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : architects.length > 0 ? (
                <div className={`flex gap-12 flex-wrap ${architects.length < 3 ? 'justify-center' : ''}`}>
                  {architects.map((architect, idx) => (
                    <div key={idx} className={`text-center group ${architects.length === 1 ? 'w-full max-w-xs mx-auto' : ''}`}>
                      <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-2 border-outline-variant group-hover:border-primary transition-colors grayscale group-hover:grayscale-0">
                        {architect.image ? (
                          <img src={architect.image} alt={architect.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-container/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-primary">person</span>
                          </div>
                        )}
                      </div>
                      <h5 className="text-lg font-bold text-[#F0F0F0]">{architect.name}</h5>
                      <p className="text-[#00979D] text-xs font-mono uppercase mb-4 tracking-wider">{architect.title}</p>
                      <p className="text-sm text-on-surface-variant leading-relaxed px-4">{architect.bio}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-on-surface-variant">No architects information available.</p>
              )}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-background py-24 relative overflow-hidden" id="pricing">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[#F0F0F0]">Scalable Workspaces</h2>
              <p className="text-on-surface-variant mt-4">Pay only for the data bandwidth you use.</p>
            </div>
            {showLoading ? (
              <div className="grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-surface-container-low border border-outline-variant/30 p-10 rounded-2xl h-96 animate-pulse">
                    <div className="h-4 w-24 bg-surface-container-high rounded mb-4"></div>
                    <div className="h-12 w-32 bg-surface-container-high rounded mb-2"></div>
                    <div className="h-4 w-20 bg-surface-container-high rounded mb-6"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(j => (
                        <div key={j} className="h-4 bg-surface-container-high rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : plans.length > 0 ? (
              <div className={`grid ${plans.length > 2 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8 items-center`}>
                {plans.slice(0, 3).map((plan) => (
                  <div key={plan.id} className={`${plan.popular ? 'relative bg-gradient-to-br from-primary/10 via-background to-primary/5 border-2 border-primary p-1 rounded-2xl overflow-visible shadow-2xl' : 'bg-surface-container-low border border-outline-variant/30 p-10 rounded-2xl flex flex-col h-full'} ${!plan.popular && plan.id !== 'free' ? 'border-l-4 border-l-primary' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 right-4 bg-primary text-on-primary text-[10px] font-bold py-1 px-4 rounded uppercase tracking-tighter z-10">
                        Most Popular
                      </div>
                    )}
                    <div className={plan.popular ? 'p-10 bg-background/40 backdrop-blur-xl flex flex-col h-full rounded-[14px]' : ''}>
                      <div className={`text-sm font-mono ${plan.popular ? 'text-primary' : 'text-on-surface-variant/60'} uppercase tracking-widest mb-4`}>{plan.name}</div>
                      <div className="text-5xl font-bold text-[#F0F0F0] mb-2">${plan.price}<span className="text-sm font-normal text-on-surface-variant">/mo</span></div>
                      <div className="text-xs text-on-surface-variant mb-6">{plan.credits} credits/month</div>
                      <ul className="space-y-4 mb-10 flex-grow">
                        {plan.features?.map((feature: string, idx: number) => (
                          <li key={idx} className={`flex items-center gap-3 text-sm ${plan.popular ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            <span className="material-symbols-outlined text-primary text-[20px]" style={plan.popular ? { fontVariationSettings: "'FILL' 1" } : {}}>check_circle</span>
                            {feature}
                          </li>
                        ))}
                        <li className={`flex items-center gap-3 text-sm ${plan.popular ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          <span className="material-symbols-outlined text-primary text-[20px]" style={plan.popular ? { fontVariationSettings: "'FILL' 1" } : {}}>check_circle</span>
                          {plan.nodes === -1 ? 'Unlimited Devices' : `${plan.nodes} Active Devices`}
                        </li>
                      </ul>
                      {plan.price === 0 ? (
                        <Link href="/auth" className="w-full py-4 border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high transition-colors rounded flex items-center justify-center">
                          Start Free
                        </Link>
                      ) : (
                        <button className={`w-full py-4 font-bold rounded flex items-center justify-center ${plan.popular ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity' : 'bg-primary text-on-primary hover:brightness-110 transition-all'}`}>
                          Upgrade Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-on-surface-variant">
                Pricing plans are currently unavailable. Please check back soon.
              </div>
            )}
            <div className="mt-12 text-center">
              <Link href={user ? "/dashboard/credits" : "/auth"} className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all group">
                Compare all features and detailed pricing
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="bg-[#1E1E1E] py-24 border-t border-outline-variant/10" id="support">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#F0F0F0] mb-4">How can we help?</h2>
              <div className="max-w-2xl mx-auto relative">
                <input className="w-full bg-[#131313] border border-outline-variant/30 rounded-lg px-12 py-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Search for documentation, errors, or guides..." type="text" />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">search</span>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <a href={discordLink} target="_blank" rel="noopener noreferrer" className="p-8 bg-[#252526] border border-outline-variant/20 rounded-xl hover:border-primary/40 transition-all flex flex-col items-center text-center group">
                <div className="w-14 h-14 bg-[#5865F2]/10 rounded-full flex items-center justify-center mb-6 text-[#5865F2] group-hover:bg-[#5865F2] group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-2xl">forum</span>
                </div>
                <h4 className="text-lg font-bold text-[#F0F0F0] mb-2">Join Discord</h4>
                <p className="text-sm text-on-surface-variant">Real-time troubleshooting with 5,000+ hardware hackers.</p>
              </a>
              {/* Support Ticket */}
              {user ? (
                <button onClick={() => setShowTicketModal(true)} className="p-8 bg-[#252526] border border-outline-variant/20 rounded-xl hover:border-primary/40 transition-all flex flex-col items-center text-center group cursor-pointer w-full">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                  </div>
                  <h4 className="text-lg font-bold text-[#F0F0F0] mb-2">Open a Ticket</h4>
                  <p className="text-sm text-on-surface-variant">Get direct support from our engineering team for complex issues.</p>
                </button>
              ) : (
                <Link href="/auth" className="p-8 bg-[#252526] border border-outline-variant/20 rounded-xl hover:border-primary/40 transition-all flex flex-col items-center text-center group">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                  </div>
                  <h4 className="text-lg font-bold text-[#F0F0F0] mb-2">Open a Ticket</h4>
                  <p className="text-sm text-on-surface-variant">Get direct support from our engineering team for complex issues.</p>
                </Link>
              )}
              {/* Documentation */}
              <Link href={user ? "/docs" : "/guide"} className="p-8 bg-[#252526] border border-outline-variant/20 rounded-xl hover:border-primary/40 transition-all flex flex-col items-center text-center group">
                <div className="w-14 h-14 bg-[#00979D]/10 rounded-full flex items-center justify-center mb-6 text-[#00979D] group-hover:bg-[#00979D] group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-2xl">menu_book</span>
                </div>
                <h4 className="text-lg font-bold text-[#F0F0F0] mb-2">Read Documentation</h4>
                <p className="text-sm text-on-surface-variant">Step-by-step guides for ESP32, Arduino, and custom firmware.</p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Support Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowTicketModal(false)}></div>
          <div className="relative bg-surface-container-low border border-outline-variant rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-on-surface">Open Support Ticket</h3>
              <button onClick={() => setShowTicketModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2">Subject</label>
                <input 
                  type="text" 
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  placeholder="Brief description of your issue"
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2">Category</label>
                <select 
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({...ticketForm, category: e.target.value as any})}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="technical">Technical</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2">Description</label>
                <textarea 
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none resize-none"
                />
              </div>
              <button 
                onClick={handleSubmitTicket}
                disabled={submitting || !ticketForm.subject || !ticketForm.description}
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .dot-grid {
          background-image: radial-gradient(circle, #ffffff 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .mockup-glow {
          box-shadow: 0 0 60px rgba(0, 151, 157, 0.15);
        }
      `}</style>
    </>
  );
}
