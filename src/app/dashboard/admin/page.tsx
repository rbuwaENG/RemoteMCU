"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminStats } from "@/lib/hooks/useAdminStats";
import { useAdminUsers } from "@/lib/hooks/useAdminUsers";
import { useAdminLogs } from "@/lib/hooks/useAdminLogs";
import { updateUserRole, getUserProfile } from "@/lib/firestore/users";
import { createAdminLog } from "@/lib/firestore/adminLogs";

export default function AdminDashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const { stats, totalUsers, activeDevices, totalDevices, monthlyRevenue, hourlyStats, loading: statsLoading } = useAdminStats();
  const { users, loading: usersLoading, refresh: refreshUsers } = useAdminUsers(5);
  const { logs, loading: logsLoading } = useAdminLogs(5);

  const [promoEmail, setPromoEmail] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ uid: string, email: string, role: "user" | "admin" } | null>(null);
  const [processingRoleChange, setProcessingRoleChange] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, loading, router]);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoEmail || promoLoading) return;

    setPromoLoading(true);
    setPromoResult(null);

    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const q = query(collection(db, "users"), where("email", "==", promoEmail));
      const snap = await getDocs(q);

      if (snap.empty) {
        setPromoResult({ type: 'error', message: "User not found." });
      } else {
        const targetUser = snap.docs[0];
        await updateUserRole(targetUser.id, "admin");
        
        if (user) {
          await createAdminLog(
            user.uid,
            user.displayName || user.email || "Admin",
            "PROMOTE_ADMIN",
            "users",
            targetUser.id,
            `Promoted ${promoEmail} to admin status`,
            "committed"
          );
        }
        
        setPromoResult({ type: 'success', message: `${promoEmail} is now an admin.` });
        setPromoEmail("");
        refreshUsers();
      }
    } catch (err: any) {
      setPromoResult({ type: 'error', message: err.message });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!pendingRoleChange || !user) return;
    
    if (pendingRoleChange.uid === user.uid && pendingRoleChange.role !== "admin") {
      alert("You cannot demote yourself. Please ask another admin to change your role.");
      setPendingRoleChange(null);
      return;
    }

    setProcessingRoleChange(true);
    try {
      await updateUserRole(pendingRoleChange.uid, pendingRoleChange.role);
      await createAdminLog(
        user.uid,
        user.displayName || user.email || "Admin",
        "UPDATE_ROLE",
        "users",
        pendingRoleChange.uid,
        `Changed role to ${pendingRoleChange.role}`,
        "committed"
      );
      setPendingRoleChange(null);
      refreshUsers();
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role. Check permissions.");
    }
    setProcessingRoleChange(false);
  };

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  const generatePath = () => {
    if (!hourlyStats || hourlyStats.length === 0) return "M0,150 L800,150";
    
    const maxDevices = Math.max(...hourlyStats.map(h => h.connectedDevices), 10);
    const step = 800 / (hourlyStats.length - 1);
    
    return hourlyStats.map((h, i) => {
      const x = i * step;
      const y = 180 - (h.connectedDevices / maxDevices) * 150;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };

  const generateAreaPath = () => {
    const path = generatePath();
    return `${path} L800,200 L0,200 Z`;
  };

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface mb-1">System Overview</h1>
          <p className="text-on-surface-variant font-mono text-xs uppercase tracking-widest">Real-time MCU node telemetry & global state</p>
        </div>
        <div className="flex gap-3">
          <form onSubmit={handlePromote} className="relative flex items-center">
            <input 
              type="email"
              placeholder="Promote user by email..."
              value={promoEmail}
              onChange={(e) => setPromoEmail(e.target.value)}
              className="bg-surface-container-high border border-outline-variant/30 rounded px-4 py-2 text-xs font-mono text-on-surface placeholder:text-white/20 w-64 focus:outline-none focus:border-primary"
            />
            <button 
              type="submit"
              disabled={promoLoading || !promoEmail}
              className="absolute right-1 px-2 py-1 bg-primary text-on-primary text-[10px] font-bold rounded hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {promoLoading ? "..." : "PROMOTE"}
            </button>
            {promoResult && (
              <div className={`absolute top-full right-0 mt-2 text-[10px] font-mono px-2 py-1 rounded shadow-lg z-50 ${
                promoResult.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-error/20 text-error'
              }`}>
                {promoResult.message}
                <button onClick={() => setPromoResult(null)} className="ml-2 opacity-60">×</button>
              </div>
            )}
          </form>
        </div>
      </div>

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
            <h2 className="text-4xl font-black text-on-surface tabular-nums">{statsLoading ? "..." : (stats?.uptime || 99.9)}%</h2>
            <div className="flex items-center gap-1 mb-1">
              <span className={`w-2 h-2 rounded-full ${(stats?.uptime || 99.9) > 95 ? 'bg-primary shadow-[0_0_8px_#67d7dd]' : 'bg-error shadow-[0_0_8px_#ffb4ab]'}`}></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 mb-8">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-xl p-8 relative">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Platform Health</h3>
              <p className="text-xs text-on-surface-variant font-mono">Real-time concurrent connections (Last 24 Data Points)</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-mono text-primary">LIVE</span>
              <span className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-mono text-on-surface-variant">24 SAMPLES</span>
            </div>
          </div>
          <div className="h-64 relative flex items-end gap-1">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="w-full h-[1px] bg-outline-variant"></div>
              <div className="w-full h-[1px] bg-outline-variant"></div>
              <div className="w-full h-[1px] bg-outline-variant"></div>
              <div className="w-full h-[1px] bg-outline-variant"></div>
            </div>
            {statsLoading ? (
               <div className="absolute inset-0 flex items-center justify-center text-white/10 uppercase font-mono text-[10px]">Sampling Telemetry...</div>
            ) : (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#67d7dd" stopOpacity="0.3"></stop>
                    <stop offset="100%" stopColor="#67d7dd" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d={generateAreaPath()} fill="url(#chartGradient)"></path>
                <path d={generatePath()} fill="none" stroke="#67d7dd" strokeLinecap="round" strokeWidth="3"></path>
                {hourlyStats.map((h, i) => {
                  const step = 800 / (hourlyStats.length - 1);
                  const maxDevices = Math.max(...hourlyStats.map(h => h.connectedDevices), 10);
                  const x = i * step;
                  const y = 180 - (h.connectedDevices / maxDevices) * 150;
                  return (
                    <g key={h.id || i} className="group/point">
                      <circle cx={x} cy={y} fill="#67d7dd" r="4" className="hover:r-6 cursor-pointer transition-all"></circle>
                      <text x={x} y={y - 10} textAnchor="middle" className="text-[8px] fill-primary font-mono opacity-0 group-hover/point:opacity-100 transition-opacity">
                        {h.connectedDevices}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          <div className="flex justify-between mt-6 px-1">
             {hourlyStats.filter((_, i) => i % 4 === 0).map((h, i) => (
                <span key={i} className="text-[8px] font-mono text-on-surface-variant uppercase tracking-tighter">
                  {h.date} {h.hour}:00
                </span>
             ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-low rounded-xl p-6 flex-1">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Recent Activity</h3>
              <span className={`w-2 h-2 rounded-full ${logs.some(l => l.status === 'failed') ? 'bg-error shadow-[0_0_8px_#ffb4ab]' : 'bg-primary shadow-[0_0_8px_#67d7dd]'}`}></span>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {logsLoading ? (
                <div className="text-center text-white/20 py-8 font-mono text-[10px]">Syncing logs...</div>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className={`flex gap-3 p-3 rounded-lg bg-surface-container-high/50 border-l-2 ${log.status === 'failed' ? 'border-error' : 'border-primary'}`}>
                    <span className={`material-symbols-outlined text-sm ${log.status === 'failed' ? 'text-error' : 'text-primary'}`}>
                      {log.action === 'UPDATE_ROLE' ? 'admin_panel_settings' : 
                       log.action === 'PROMOTE_ADMIN' ? 'star' :
                       log.status === 'failed' ? 'error' : 'history'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-on-surface truncate">{log.description}</p>
                      <p className="text-[9px] text-on-surface-variant mt-0.5 truncate">by {log.adminName}</p>
                      <p className="text-[8px] font-mono text-white/30 uppercase mt-1">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-white/20 py-8 font-mono text-[10px]">No recent activity</div>
              )}
            </div>
            <Link href="/dashboard/admin/tickets" className="block w-full mt-6 py-3 text-center text-[10px] font-mono border border-outline-variant/20 hover:bg-surface-container-high text-on-surface-variant uppercase transition-all">
              View Activity Audit
            </Link>
          </div>
        </div>
      </div>

      <div className="col-span-12 bg-surface-container-low rounded-xl overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center bg-surface-container-high/50">
          <h3 className="text-lg font-bold text-on-surface">Admin Pulse</h3>
          <Link href="/dashboard/admin/users" className="text-xs text-primary hover:underline">Manage All Users</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-surface-container-high/20">
                <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Identity</th>
                <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Role</th>
                <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Status</th>
                <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Engagement</th>
                <th className="px-8 py-4 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/20">
              {usersLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-4 text-center text-on-surface-variant">Synchronizing identity state...</td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.uid} className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-highest border border-white/5 flex items-center justify-center text-xs font-bold text-primary">
                          {u.displayName?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{u.displayName || "Anonymous User"}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase ${u.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-error'}`}></span>
                        <span className="text-[10px] font-mono uppercase text-on-surface-variant">{u.status || 'active'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 font-mono text-[10px] text-on-surface-variant">
                      {u.lastActiveAt?.toDate ? u.lastActiveAt.toDate().toLocaleDateString() : 'New Inbound'}
                    </td>
                    <td className="px-8 py-4">
                      <button 
                        onClick={() => setPendingRoleChange({ uid: u.uid, email: u.email, role: u.role === 'admin' ? 'user' : 'admin' })}
                        className="text-[10px] font-mono uppercase px-3 py-1.5 rounded border border-white/10 text-white/60 hover:bg-white/5 hover:text-primary hover:border-primary/30 transition-all"
                      >
                        {u.role === 'admin' ? 'Demote' : 'Promote'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-4 text-center text-on-surface-variant">No identity records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingRoleChange && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-[#1C1C1C] border border-white/10 rounded-sm p-8 w-full max-w-md shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <span className="material-symbols-outlined text-3xl text-primary">
                {pendingRoleChange.role === 'admin' ? 'verified_user' : 'person_remove'}
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-on-surface text-center mb-2">Confirm Role Change</h3>
            <p className="text-white/60 text-center mb-8">
              Are you sure you want to change the role of <span className="text-on-surface font-mono">{pendingRoleChange.email}</span> to <span className="text-primary font-bold uppercase">{pendingRoleChange.role}</span>?
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPendingRoleChange(null)}
                className="px-6 py-3 border border-white/10 text-white/60 rounded-sm hover:bg-white/5 transition-all font-mono text-xs uppercase"
                disabled={processingRoleChange}
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                className="px-6 py-3 bg-primary text-on-primary rounded-sm font-bold hover:brightness-110 transition-all font-mono text-xs uppercase shadow-[0_0_20px_rgba(103,215,221,0.2)] disabled:opacity-50"
                disabled={processingRoleChange}
              >
                {processingRoleChange ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
