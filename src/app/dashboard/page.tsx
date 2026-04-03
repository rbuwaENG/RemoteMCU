"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDevices } from "@/lib/hooks/useDevices";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { usePlans } from "@/lib/hooks/usePlans";

export default function DashboardPage() {
  const { user } = useAuth();
  const { devices, totalDevices, onlineDevices, loading: devicesLoading } = useDevices(user?.uid);
  const { credits, plan: planId, deviceQuota, loading: profileLoading } = useUserProfile(user?.uid);
  const { plans, loading: plansLoading } = usePlans();

  const sessionsToday = 0;

  const currentPlan = plans.find((p: any) => p.id === planId || p.name.toLowerCase().replace(" ", "-") === planId?.toLowerCase());
  const planName = currentPlan?.name || planId?.charAt(0).toUpperCase() + planId?.slice(1) || "Free";
  const maxDevicesNum = currentPlan?.nodes === -1 ? Infinity : (currentPlan?.nodes || deviceQuota || 3);
  const maxDevicesStr = maxDevicesNum === Infinity ? "Unlimited" : maxDevicesNum;

  return (
    <>
      <header className="mb-10 flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-[10px] font-mono tracking-[0.3em] text-primary uppercase">Core Executive</h2>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface">Systems Overview</h1>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="bg-white/5 p-8 rounded-sm relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 p-6">
            <span className="material-symbols-outlined text-white/5 text-4xl group-hover:text-primary/20 transition-colors">memory</span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-4">Total Devices</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tighter text-on-surface">{devicesLoading ? "..." : totalDevices}</span>
            <span className="text-sm font-mono text-white/20">units</span>
          </div>
        </div>
        <div className="bg-white/5 p-8 rounded-sm relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 p-6">
            <span className="material-symbols-outlined text-green-500/5 text-4xl group-hover:text-green-500/20 transition-colors">sensors</span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-4">Online Devices</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tighter text-green-500">{devicesLoading ? "..." : onlineDevices}</span>
            <span className="text-sm font-mono text-green-500/40">active</span>
          </div>
        </div>
        <div className="bg-white/5 p-8 rounded-sm relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 p-6">
            <span className="material-symbols-outlined text-primary/5 text-4xl group-hover:text-primary/20 transition-colors">account_balance_wallet</span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-4">Credits Remaining</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tighter text-primary">{profileLoading ? "..." : credits}</span>
            <span className="text-sm font-mono text-primary/40">mcu/c</span>
          </div>
        </div>
        <div className="bg-white/5 p-8 rounded-sm relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 p-6">
            <span className="material-symbols-outlined text-white/5 text-4xl group-hover:text-white/20 transition-colors">history</span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-4">Sessions Today</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tighter text-on-surface">{sessionsToday}</span>
            <span className="text-sm font-mono text-white/20">runs</span>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold tracking-tight text-on-surface">My Devices</h3>
          <span className="px-2 py-0.5 bg-white/10 rounded-sm text-[10px] font-mono text-on-surface-variant uppercase">
            {totalDevices} Nodes
          </span>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/devices" className="p-2 text-primary">
            <span className="material-symbols-outlined">grid_view</span>
          </Link>
          <button className="p-2 text-neutral-600 hover:text-white transition-colors">
            <span className="material-symbols-outlined">list</span>
          </button>
        </div>
      </div>

      {totalDevices > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {devices.slice(0, 6).map((device) => (
            <Link
              key={device.id}
              href={`/dashboard/device/${device.id}`}
              className={`bg-white/5 p-6 rounded-sm border border-white/5 hover:border-primary/30 transition-all group ${device.status === 'offline' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#4CAF50]' : 'bg-red-500'}`}></span>
                <h4 className="text-on-surface font-medium truncate">{device.name}</h4>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
                <span>{device.board}</span>
                <span className="group-hover:text-primary transition-colors">Open →</span>
              </div>
            </Link>
          ))}
          {totalDevices > 6 && (
            <Link href="/dashboard/devices" className="bg-white/5 p-6 rounded-sm border border-dashed border-white/10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
              +{totalDevices - 6} more devices
            </Link>
          )}
        </div>
      ) : (
        <section className="min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-white/[0.02] border border-dashed border-white/10 rounded-sm mb-12">
          <div className="w-24 h-24 mb-8 text-primary/30 flex items-center justify-center bg-primary/5 rounded-full border border-primary/10">
            <span className="material-symbols-outlined text-6xl">developer_board</span>
          </div>
          <h4 className="text-3xl font-bold text-on-surface mb-4 tracking-tight">No Devices Found</h4>
          <p className="text-on-surface-variant max-w-lg mb-10 leading-relaxed">
            It looks like your hardware fleet is empty. Connect your first microcontroller via serial or Wi-Fi to start visualizing real-time telemetry and debug logic.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard/devices?add=true" className="px-8 py-3 bg-[#67d7dd] text-[#003739] text-xs font-bold tracking-widest uppercase rounded-sm hover:opacity-90 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span>
              ADD YOUR FIRST DEVICE
            </Link>
            <Link href="/docs" className="px-8 py-3 border border-white/10 text-white/60 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-white/5 hover:text-white transition-all">
              VIEW DOCUMENTATION
            </Link>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-baseline gap-4 mb-4">
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">System Logs</h3>
            <span className="text-[10px] font-mono text-primary uppercase">Streaming Live</span>
          </div>
          <div className="bg-[#0E0E0E]/80 border-l-4 border-primary p-8 font-mono text-[13px] text-white/60 leading-relaxed shadow-2xl min-h-[200px] flex items-center justify-center italic opacity-50">
            {totalDevices > 0 ? "Real-time serial output will appear here when devices are connected..." : "Waiting for device connection..."}
          </div>
        </div>
        <div className="bg-white/5 rounded-sm p-10 flex flex-col justify-between border border-white/5 relative group">
          <div>
            <h4 className="text-[10px] font-mono tracking-[0.2em] text-[#67d7dd] uppercase mb-8">Plan Status</h4>
            <p className="text-on-surface text-lg font-medium leading-relaxed mb-8">
              Your current plan is <span className="text-primary font-bold">{plansLoading ? "..." : planName}</span>.
              {maxDevicesNum !== Infinity ? (
                <> You have used <span className="text-[#67d7dd] font-black">{totalDevices}</span> out of <span className="text-[#67d7dd] font-black">{maxDevicesStr}</span> device slots.</>
              ) : (
                <> You have unlimited device slots.</>
              )}
            </p>
            {maxDevicesNum !== Infinity && (
              <div className="w-full bg-white/5 rounded-full h-2 mb-10 overflow-hidden border border-white/5">
                <div 
                  className="bg-[#67d7dd] h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(103,215,221,0.3)]" 
                  style={{ width: `${Math.min((totalDevices / (maxDevicesNum as number)) * 100, 100)}%` }}
                ></div>
              </div>
            )}
          </div>
          <Link href="/dashboard/credits" className="w-full py-4 bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase hover:bg-primary/20 transition-all rounded flex items-center justify-center border border-primary/20">
            Upgrade Capacity
          </Link>
          <div className="absolute top-0 right-0 w-12 h-12 bg-[#67d7dd] rounded-sm shadow-xl flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform translate-x-2 -translate-y-2">
            <span className="material-symbols-outlined text-[#003739] text-3xl">bolt</span>
          </div>
        </div>
      </section>
    </>
  );
}