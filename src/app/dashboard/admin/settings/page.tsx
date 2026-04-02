"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    siteName: "RemoteMCU",
    siteUrl: "https://remotemcu.example.com",
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerification: true,
    maxDevicesPerUser: 10,
    defaultPlan: "free",
    apiRateLimit: 100,
    sessionTimeout: 30,
    webhookUrl: "",
    smtpHost: "smtp.example.com",
    smtpPort: 587,
    smtpFrom: "noreply@remotemcu.example.com",
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <header className="mb-10 flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-[10px] font-mono tracking-[0.3em] text-primary uppercase">Admin Control</h2>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface">System Settings</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white/5 rounded-sm p-8 border border-white/5">
            <h3 className="text-xl font-bold text-on-surface mb-6">General Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Site URL</label>
                <input
                  type="text"
                  value={settings.siteUrl}
                  onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </section>

          <section className="bg-white/5 rounded-sm p-8 border border-white/5">
            <h3 className="text-xl font-bold text-on-surface mb-6">User Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-on-surface font-medium">Registration Enabled</p>
                  <p className="text-white/40 text-sm">Allow new users to register</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, registrationEnabled: !settings.registrationEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.registrationEnabled ? "bg-primary" : "bg-white/20"}`}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.registrationEnabled ? "translate-x-6" : "translate-x-0.5"}`}></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-on-surface font-medium">Email Verification</p>
                  <p className="text-white/40 text-sm">Require email verification for new accounts</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, emailVerification: !settings.emailVerification })}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.emailVerification ? "bg-primary" : "bg-white/20"}`}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.emailVerification ? "translate-x-6" : "translate-x-0.5"}`}></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-on-surface font-medium">Maintenance Mode</p>
                  <p className="text-white/40 text-sm">Put the site in maintenance mode</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.maintenanceMode ? "bg-primary" : "bg-white/20"}`}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.maintenanceMode ? "translate-x-6" : "translate-x-0.5"}`}></span>
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Max Devices Per User</label>
                <input
                  type="number"
                  value={settings.maxDevicesPerUser}
                  onChange={(e) => setSettings({ ...settings, maxDevicesPerUser: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Default Plan</label>
                <select
                  value={settings.defaultPlan}
                  onChange={(e) => setSettings({ ...settings, defaultPlan: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white/5 rounded-sm p-8 border border-white/5">
            <h3 className="text-xl font-bold text-on-surface mb-6">API & Security</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">API Rate Limit (requests/hour)</label>
                <input
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={(e) => setSettings({ ...settings, apiRateLimit: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Webhook URL</label>
                <input
                  type="text"
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface placeholder:text-white/40 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white/5 rounded-sm p-8 border border-white/5">
            <h3 className="text-xl font-bold text-on-surface mb-6">Email Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">SMTP Host</label>
                <input
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">SMTP Port</label>
                <input
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">From Email</label>
                <input
                  type="text"
                  value={settings.smtpFrom}
                  onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </section>

          <section className="bg-white/5 rounded-sm p-8 border border-white/5">
            <h3 className="text-xl font-bold text-on-surface mb-6">Actions</h3>
            <div className="space-y-4">
              <button className="w-full py-3 bg-primary text-[#003739] text-xs font-bold tracking-widest uppercase rounded-sm hover:opacity-90 transition-all">
                Save Changes
              </button>
              <button className="w-full py-3 border border-white/10 text-white/60 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-white/5 hover:text-white transition-all">
                Reset to Defaults
              </button>
              <button className="w-full py-3 border border-red-500/20 text-red-500 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-red-500/5 transition-all">
                Clear Cache
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
