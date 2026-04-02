"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState("how-it-works");

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-background text-on-surface">
        {/* Hero Section */}
        <section className="py-20 px-6 bg-surface-container-low">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-black text-on-surface mb-4">
              How RemoteMCU Works
            </h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Get started with remote microcontroller debugging in under 5 minutes
            </p>
          </div>
        </section>

        {/* Navigation Tabs */}
        <section className="px-6 border-b border-outline-variant/20">
          <div className="max-w-4xl mx-auto flex gap-1">
            <button
              onClick={() => setActiveSection("how-it-works")}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeSection === "how-it-works" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => setActiveSection("onboarding")}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeSection === "onboarding" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Onboarding Guide
            </button>
            <button
              onClick={() => setActiveSection("features")}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeSection === "features" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Features
            </button>
          </div>
        </section>

        {/* How It Works Section */}
        {activeSection === "how-it-works" && (
          <section className="py-16 px-6">
            <div className="max-w-3xl mx-auto space-y-12">
              
              {/* Step 1 */}
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-on-surface mb-2">Create an Account</h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    Sign up for free at RemoteMCU. No credit card required. Get 10 free credits to try the platform.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-on-surface mb-2">Set Up Your Device</h2>
                  <p className="text-on-surface-variant leading-relaxed mb-3">
                    Connect your ESP32, Arduino, or STM32 to a computer. Download and run the Host Agent with your token.
                  </p>
                  <div className="bg-surface-container-high p-4 rounded-lg inline-block">
                    <code className="text-sm font-mono text-primary">
                      python host_agent.py --token YOUR_TOKEN
                    </code>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-on-surface mb-2">Start Coding Remotely</h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    Upload code, monitor serial output, and debug your microcontroller from anywhere in the world through your browser.
                  </p>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Onboarding Guide Section */}
        {activeSection === "onboarding" && (
          <section className="py-16 px-6">
            <div className="max-w-3xl mx-auto space-y-12">
              
              <div className="bg-surface-container-high p-6 rounded-xl border border-primary/20">
                <h2 className="text-2xl font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">devices</span>
                  Device Onboarding Step by Step
                </h2>
                <p className="text-on-surface-variant">
                  Follow these steps to connect your microcontroller to RemoteMCU.
                </p>
              </div>

              {/* Step 1 */}
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Download the Host Agent</h3>
                  <p className="text-on-surface-variant leading-relaxed mb-4">
                    Download the Host Agent for your operating system. The agent runs on a computer that's connected to your microcontroller via USB or network.
                  </p>
                  <Link href="/download" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                    <span>Download Host Agent</span>
                    <span className="material-symbols-outlined text-sm">download</span>
                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Get Your Setup Token</h3>
                  <p className="text-on-surface-variant leading-relaxed mb-4">
                    Go to your dashboard and click "Link Device". A unique setup token will be generated. This token connects your device to your account.
                  </p>
                  <div className="bg-surface-container-high p-4 rounded-lg">
                    <p className="text-sm text-on-surface-variant mb-2">Example token format:</p>
                    <code className="text-sm font-mono text-primary">RMCU-XXXXXXXXXXXX</code>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Run the Host Agent</h3>
                  <p className="text-on-surface-variant leading-relaxed mb-4">
                    Extract the downloaded file and run the agent with your token:
                  </p>
                  <div className="bg-[#1E1E1E] p-4 rounded-lg font-mono text-sm mb-4">
                    <p className="text-primary"># Windows</p>
                    <p className="text-on-surface">python src\host_agent.py --token RMCU-XXXXXXXXXXXX</p>
                    <p className="text-primary mt-4"># Linux/macOS</p>
                    <p className="text-on-surface">python src/host_agent.py --token RMCU-XXXXXXXXXXXX</p>
                  </div>
                  <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg">
                    <p className="text-sm text-warning">
                      <strong>Note:</strong> Make sure your microcontroller is connected to the computer via USB before running the agent.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-primary">4</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Link Your Device</h3>
                  <p className="text-on-surface-variant leading-relaxed mb-4">
                    The Host Agent will detect your connected microcontroller and register it with RemoteMCU. Go to "Link Device" in your dashboard to complete the connection.
                  </p>
                  <ul className="space-y-2 text-on-surface-variant">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                      Agent detects your MCU via serial/USB
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                      Device appears in your dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                      Start remote coding immediately
                    </li>
                  </ul>
                </div>
              </div>

              {/* Supported Devices */}
              <div className="bg-surface-container-high p-6 rounded-xl">
                <h3 className="text-xl font-bold text-on-surface mb-4">Supported Microcontrollers</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {["ESP32", "ESP8266", "Arduino Uno", "Arduino Nano", "STM32", "Raspberry Pi Pico"].map((board) => (
                    <div key={board} className="flex items-center gap-2 p-3 bg-surface-container-low rounded-lg">
                      <span className="material-symbols-outlined text-primary">memory</span>
                      <span className="text-sm font-medium text-on-surface">{board}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Features Section */}
        {activeSection === "features" && (
          <section className="py-16 px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-on-surface mb-8 text-center">What You Can Do</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-surface-container-high p-6 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-3xl mb-4">cloud_upload</span>
                  <h3 className="font-bold text-on-surface mb-2">Remote Upload</h3>
                  <p className="text-sm text-on-surface-variant">Push firmware updates Over-The-Air (OTA) to your devices securely.</p>
                </div>
                <div className="bg-surface-container-high p-6 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-3xl mb-4">terminal</span>
                  <h3 className="font-bold text-on-surface mb-2">Serial Monitor</h3>
                  <p className="text-sm text-on-surface-variant">View real-time serial output and send commands to your MCU.</p>
                </div>
                <div className="bg-surface-container-high p-6 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-3xl mb-4">videocam</span>
                  <h3 className="font-bold text-on-surface mb-2">Camera Feed</h3>
                  <p className="text-sm text-on-surface-variant">Stream video from ESP32-CAM or USB cameras connected to your device.</p>
                </div>
                <div className="bg-surface-container-high p-6 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-3xl mb-4">bug_report</span>
                  <h3 className="font-bold text-on-surface mb-2">Remote Debugging</h3>
                  <p className="text-sm text-on-surface-variant">Debug your code step-by-step from anywhere in the world.</p>
                </div>
                <div className="bg-surface-container-high p-6 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-3xl mb-4">code</span>
                  <h3 className="font-bold text-on-surface mb-2">Code Editor</h3>
                  <p className="text-sm text-on-surface-variant">Built-in code editor with syntax highlighting for C/C++.</p>
                </div>
                <div className="bg-surface-container-high p-6 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-3xl mb-4">cloud</span>
                  <h3 className="font-bold text-on-surface mb-2">Cloud Compilation</h3>
                  <p className="text-sm text-on-surface-variant">Compile your code remotely using our cloud compiler.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-on-surface mb-4">Ready to Get Started?</h2>
            <p className="text-on-surface-variant mb-8">
              Join thousands of engineers debugging hardware remotely
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/auth" className="px-6 py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all">
                Create Free Account
              </Link>
              <Link href="/download" className="px-6 py-3 border border-outline-variant text-on-surface font-bold rounded-lg hover:bg-surface-container-high transition-all">
                Download Agent
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
