"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { useSiteContent } from "@/lib/hooks/useSiteContent";

export default function AboutPage() {
  const { siteName, content: siteContent, loading } = useSiteContent();
  return (
    <>
      <Navbar />

      <main className="bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container antialiased">
        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-on-surface-variant">Loading...</div>
          </div>
        ) : (
          <>
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-xl mb-16 min-h-[500px] flex items-center bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-low border border-white/5">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 right-10 w-64 h-64 border border-primary/20 rounded-full animate-pulse"></div>
            <div className="absolute bottom-10 left-20 w-40 h-40 border border-primary/30 rounded-full"></div>
            <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-primary/10 rounded-lg rotate-45"></div>
            <div className="absolute bottom-20 right-1/4 w-32 h-32 border border-secondary/20 rotate-12"></div>
          </div>
          
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMEw0MCAwTDAgNDBNMDQgMEw0MCA0ME0wOCAwTDgwIDBMMCA0ME0xMiAwTDEyIDQwTDAgMTJMMTIgNDBNMjAgMEwyMCA0MEwwIDIweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjlkNWRlIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')] opacity-20"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 px-8 lg:px-16 py-12 w-full max-w-[1440px] mx-auto">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-[2px] w-12 bg-primary"></div>
                <span className="font-mono text-xs tracking-widest text-primary uppercase">Mission Protocol</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tighter text-on-surface mb-6 leading-tight">
                {siteContent.about?.mission || "Hardware Debugging,"}
                <span className="text-primary italic"> Redefined.</span>
              </h1>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-8 max-w-lg">
                {siteContent.about?.story || "At Remote MCU, we're building the bridge between digital innovation and physical hardware. A digital cockpit for the modern hardware engineer."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard/devices" className="bg-primary text-on-primary px-8 py-4 rounded-lg font-bold tracking-tight text-sm active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30">
                  <span className="material-symbols-outlined">devices</span>
                  Explore Devices
                </Link>
                <Link href="/docs" className="border border-outline-variant text-on-surface px-8 py-4 rounded-lg font-bold tracking-tight text-sm hover:bg-surface-container-high transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined">menu_book</span>
                  Read Docs
                </Link>
              </div>
            </div>
            
            {/* Right Side Visual */}
            <div className="hidden lg:flex items-center justify-center relative">
              <div className="relative w-full max-w-md">
                {/* Main image container */}
                <div className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/20 shadow-2xl">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(103,215,221,0.3)_0%,transparent_70%)]"></div>
                    <span className="material-symbols-outlined text-8xl text-primary/60">memory</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="bg-surface-container-low rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-primary">10K+</div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">Devices</div>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-secondary">50+</div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">Companies</div>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-tertiary">99.9%</div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">Uptime</div>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-surface-container-high rounded-xl p-3 border border-outline-variant/20 shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                  <span className="material-symbols-outlined text-primary">cloud_upload</span>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-surface-container-high rounded-xl p-3 border border-outline-variant/20 shadow-xl">
                  <span className="material-symbols-outlined text-secondary">terminal</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-24 max-w-[1440px] mx-auto px-8">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="text-3xl font-black tracking-tight text-on-surface">Meet the Team</h2>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Engineering Collective / {siteContent.architects?.length || 0}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(siteContent.architects || []).map((architect, idx) => (
              <div key={idx} className="bg-surface-container-low p-8 rounded-lg group hover:bg-surface-container-high transition-colors border border-white/5">
                <div className="relative w-20 h-20 mb-6">
                  {architect.image ? (
                    <img src={architect.image} alt={architect.name} className="w-20 h-20 rounded-full border-2 border-primary grayscale group-hover:grayscale-0 transition-all duration-500 object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-2 border-primary grayscale group-hover:grayscale-0 transition-all duration-500 bg-gradient-to-br from-primary/20 to-primary-container/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-primary">person</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full"></div>
                </div>
                <h3 className="text-xl font-bold mb-1 text-on-surface">{architect.name}</h3>
                <p className="text-primary font-mono text-xs mb-4 uppercase tracking-wider">{architect.title}</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {architect.bio}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 max-w-[1440px] mx-auto px-8 mb-24">
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <h2 className="text-4xl font-black tracking-tighter mb-8 text-on-surface leading-none">The Genesis of the Synthetic Workshop</h2>
              <div className="space-y-6 text-on-surface-variant">
                <p className="leading-relaxed">
                  {siteContent.about?.story || "Remote MCU didn't start in a boardroom. It started in a cluttered garage where long-distance collaboration on physical prototypes felt like an impossible dream."}
                </p>
                <p className="leading-relaxed">
                  We saw engineers spending more time on logistics than on logic. We saw the gap between the speed of software development and the friction of hardware iteration.
                </p>
                <div className="bg-surface-container-high p-6 rounded-lg border-l-4 border-primary">
                  <span className="text-primary font-mono text-sm block mb-2">// CORE PHILOSOPHY</span>
                  <p className="italic text-on-surface">"Physical hardware should be as accessible as a cloud server. Geography should not be a bottleneck for innovation."</p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 space-y-12">
            {/* Timeline Entry 1 */}
            <div className="relative pl-12 border-l border-outline-variant/30">
              <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary"></div>
              <span className="font-mono text-xs text-primary mb-2 block tracking-widest">EST. 2019</span>
              <h4 className="text-xl font-bold mb-3 text-on-surface">Open-Source Roots</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Founded as an open-source tool for remote ESP32 debugging. Within months, the community grew to 5,000 developers worldwide, proving the demand for remote hardware access.
              </p>
            </div>
            {/* Timeline Entry 2 */}
            <div className="relative pl-12 border-l border-outline-variant/30">
              <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary/50"></div>
              <span className="font-mono text-xs text-on-surface-variant mb-2 block tracking-widest">2021</span>
              <h4 className="text-xl font-bold mb-3 text-on-surface">The Bridge Architecture</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Developed the proprietary 'MCU Bridge'—a low-latency hardware interface that allowed engineers to flash and debug physical boards from across the globe with less than 50ms of delay.
              </p>
            </div>
            {/* Timeline Entry 3 */}
            <div className="relative pl-12 border-l border-outline-variant/30">
              <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary/50"></div>
              <span className="font-mono text-xs text-on-surface-variant mb-2 block tracking-widest">PRESENT</span>
              <h4 className="text-xl font-bold mb-3 text-on-surface">The Enterprise Pivot</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Now supporting over 50 global engineering firms, Remote MCU provides the infrastructure for distributed hardware teams to ship products faster than ever before.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-32 pt-16 border-t border-outline-variant/10 text-center pb-8">
          <h3 className="text-2xl font-bold mb-10 text-on-surface">Ready to join the future of engineering?</h3>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-16">
            {siteContent.socialLinks?.discord && (
              <a className="flex items-center gap-3 px-8 py-4 bg-[#00979D] text-white rounded font-bold tracking-tight hover:brightness-110 transition-all active:scale-95" href={siteContent.socialLinks.discord} target="_blank" rel="noopener noreferrer">
                <span className="material-symbols-outlined">forum</span>
                Discord Channel
              </a>
            )}
            {siteContent.socialLinks?.buymeacoffee && (
              <a className="flex items-center gap-3 px-8 py-4 bg-[#00979D] text-white rounded font-bold tracking-tight hover:brightness-110 transition-all active:scale-95" href={siteContent.socialLinks.buymeacoffee} target="_blank" rel="noopener noreferrer">
                <span className="material-symbols-outlined">coffee</span>
                Buy Me a Coffee
              </a>
            )}
          </div>
          <p className="font-mono text-[10px] text-outline opacity-50 uppercase tracking-widest">
            © 2024 Remote MCU Systems Ltd. // All Rights Reserved.
          </p>
        </footer>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
