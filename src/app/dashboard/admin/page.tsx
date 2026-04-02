"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useAdminStats } from "@/lib/hooks/useAdminStats";
import { useAdminUsers } from "@/lib/hooks/useAdminUsers";

export default function AdminDashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const { stats, totalUsers, activeDevices, totalDevices, monthlyRevenue, loading: statsLoading } = useAdminStats();
  const { users, loading: usersLoading } = useAdminUsers(5);

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
    <div className="min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface mb-1">System Overview</h1>
          <p className="text-on-surface-variant font-mono text-xs uppercase tracking-widest">Real-time MCU node telemetry & global state</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-xs font-mono border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Logs
          </button>
          <button className="px-4 py-2 text-xs font-mono bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold shadow-lg shadow-primary/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span>
            Provision Node
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-5xl">groups</span>
          </div>
          <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-tighter mb-4 flex items-center gap-2">
            <span className="w-1 h-3 bg-primary rounded-full"></span>
            Total Users
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-on-surface tabular-nums">{statsLoading ? "..." : totalUsers}</h2>
            <span className="text-xs text-primary font-mono">users</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group border-b-2 border-primary/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-5xl">hub</span>
          </div>
          <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-tighter mb-4 flex items-center gap-2">
            <span className="w-1 h-3 bg-primary rounded-full"></span>
            Active Nodes
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-on-surface tabular-nums">{statsLoading ? "..." : activeDevices}</h2>
            <span className="text-xs text-on-surface-variant font-mono">/ {statsLoading ? "..." : totalDevices}</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-5xl">account_balance_wallet</span>
          </div>
          <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-tighter mb-4 flex items-center gap-2">
            <span className="w-1 h-3 bg-primary rounded-full"></span>
            Revenue This Month
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-on-surface tabular-nums">${statsLoading ? "..." : monthlyRevenue.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-5xl">bolt</span>
          </div>
          <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-tighter mb-4 flex items-center gap-2">
            <span className="w-1 h-3 bg-primary rounded-full"></span>
            System Uptime
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-on-surface tabular-nums">99.9%</h2>
            <div className="flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#67d7dd]"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Layout Main */}
      <div className="grid grid-cols-12 gap-8 mb-8">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-xl p-8 relative">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Platform Health</h3>
              <p className="text-xs text-on-surface-variant font-mono">Real-time concurrent connections across global edge nodes</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-mono text-primary">LIVE</span>
              <span className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-mono text-on-surface-variant">24H</span>
            </div>
          </div>
          <div className="h-64 relative flex items-end gap-1">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="w-full h-[1px] bg-outline-variant"></div>
              <div className="w-full h-[1px] bg-outline-variant"></div>
              <div className="w-full h-[1px] bg-outline-variant"></div>
              <div className="w-full h-[1px] bg-outline-variant"></div>
            </div>
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#67d7dd" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#67d7dd" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path d="M0,150 Q100,80 200,120 T400,60 T600,100 T800,40 V200 H0 Z" fill="url(#chartGradient)"></path>
              <path d="M0,150 Q100,80 200,120 T400,60 T600,100 T800,40" fill="none" stroke="#67d7dd" strokeLinecap="round" strokeWidth="3"></path>
              <circle cx="400" cy="60" fill="#67d7dd" r="4"></circle>
            </svg>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-low rounded-xl p-6 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">System Alerts</h3>
              <span className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_#ffb4ab]"></span>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-lg bg-error-container/10 border-l-4 border-error">
                <span className="material-symbols-outlined text-error">warning</span>
                <div>
                  <p className="text-sm font-bold text-on-error-container">Node Cluster FR-04 Timeout</p>
                  <p className="text-xs text-on-surface-variant mt-1">Connection lost with 14 hardware instances in Paris region.</p>
                  <p className="text-[10px] font-mono text-error uppercase mt-2">Critical - 4m ago</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-lg bg-surface-container-high border-l-4 border-tertiary">
                <span className="material-symbols-outlined text-tertiary">speed</span>
                <div>
                  <p className="text-sm font-bold text-on-surface">High Latency - US-EAST</p>
                  <p className="text-xs text-on-surface-variant mt-1">Average ping exceeding 250ms on documentation sub-nodes.</p>
                  <p className="text-[10px] font-mono text-on-surface-variant uppercase mt-2">Warning - 12m ago</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-3 text-xs font-mono border border-outline-variant/20 hover:bg-surface-container-high text-on-surface-variant uppercase transition-all">
              View All Incidents
            </button>
          </div>
        </div>
      </div>

      <div className="col-span-12 bg-surface-container-low rounded-xl overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center bg-surface-container-high/50">
          <h3 className="text-lg font-bold text-on-surface">Recent Users</h3>
          <Link href="/dashboard/admin/users" className="text-xs text-primary hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-surface-container-high/20">
                <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">User</th>
                <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Email</th>
                <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Role</th>
                <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/20">
              {usersLoading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-4 text-center text-on-surface-variant">Loading...</td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.uid} className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold">
                          {u.displayName?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{u.displayName || "User"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-on-surface-variant">{u.email}</td>
                    <td className="px-8 py-4">
                      <span className="text-xs px-2 py-0.5 bg-surface-container-high rounded font-mono text-on-surface uppercase">{u.role}</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${u.status === 'active' ? 'text-primary bg-primary/10' : 'text-error bg-error/10'}`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-4 text-center text-on-surface-variant">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}