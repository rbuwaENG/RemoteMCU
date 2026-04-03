"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useAdminStats } from "@/lib/hooks/useAdminStats";
import { getAllDevices, Device } from "@/lib/firestore/devices";
import { getUserProfile } from "@/lib/firestore/users";

export default function AdminDevicesPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { totalDevices, activeDevices, loading: statsLoading } = useAdminStats();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const allDevices = await getAllDevices();
        const now = new Date().getTime();
        const updatedDevices = allDevices.map(device => {
          let isStale = false;
          if (device.status === "online" && device.lastSeen?.toDate) {
            const lastSeenTime = device.lastSeen.toDate().getTime();
            if (now - lastSeenTime > 120000) {
              isStale = true;
            }
          }
          return {
            ...device,
            status: isStale ? "offline" : device.status
          };
        });
        setDevices(updatedDevices);
      } catch (error) {
        console.error("Failed to fetch devices:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAdmin) {
      fetchDevices();
    }
  }, [isAdmin]);

  const filteredDevices = devices.filter((device) => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.board.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || device.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || !user || !isAdmin) {
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
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface">Device Management</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-low p-4 rounded-lg">
          <p className="text-[10px] font-mono text-on-surface-variant uppercase">Total Devices</p>
          <p className="text-2xl font-bold text-on-surface">{statsLoading ? "..." : totalDevices}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-lg">
          <p className="text-[10px] font-mono text-on-surface-variant uppercase">Online</p>
          <p className="text-2xl font-bold text-green-500">{activeDevices}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-lg">
          <p className="text-[10px] font-mono text-on-surface-variant uppercase">Offline</p>
          <p className="text-2xl font-bold text-on-surface">{totalDevices - activeDevices}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-lg">
          <p className="text-[10px] font-mono text-on-surface-variant uppercase">Error</p>
          <p className="text-2xl font-bold text-error">0</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">search</span>
          <input
            type="text"
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-sm pl-12 pr-4 py-3 text-on-surface placeholder:text-white/40 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="error">Error</option>
        </select>
      </div>

      <section className="bg-white/[0.02] border border-dashed border-white/10 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Device</th>
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Owner</th>
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Board</th>
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Last Seen</th>
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-white/40">Loading devices...</td>
              </tr>
            ) : filteredDevices.length > 0 ? (
              filteredDevices.map((device) => (
                <tr key={device.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-on-surface font-medium">{device.name}</p>
                      <p className="text-white/40 text-sm font-mono">{device.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm">{device.ownerId}</td>
                  <td className="px-6 py-4 text-white/60 text-sm">{device.board}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-mono uppercase rounded-sm ${
                      device.status === "online" ? "bg-green-500/20 text-green-500" :
                      device.status === "offline" ? "bg-white/10 text-white/40" :
                      "bg-red-500/20 text-red-500"
                    }`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/40 text-sm font-mono">
                    {device.lastSeen?.toDate ? device.lastSeen.toDate().toLocaleString() : "Never"}
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-white/40 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-white/40">No devices found</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="flex items-center justify-between mt-8">
        <p className="text-white/40 text-sm">Showing {filteredDevices.length} of {devices.length} devices</p>
      </div>
    </>
  );
}