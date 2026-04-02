import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GlobalStats, getGlobalStats } from "@/lib/firestore/stats";
import { getOnlineDevicesCount, getAllDevices } from "@/lib/firestore/devices";
import { getAllUsers } from "@/lib/firestore/users";

export const useAdminStats = () => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeDevices, setActiveDevices] = useState(0);
  const [totalDevices, setTotalDevices] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const statsRef = doc(db, "stats", "global");
    
    const unsubscribe = onSnapshot(statsRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          setStats(docSnap.data() as GlobalStats);
        } else {
          const users = await getAllUsers();
          const devices = await getAllDevices();
          const online = devices.filter(d => d.status === "online").length;
          
          setTotalUsers(users.length);
          setTotalDevices(devices.length);
          setActiveDevices(online);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    stats,
    totalUsers,
    activeDevices,
    totalDevices,
    monthlyRevenue: stats?.monthlyRevenue ?? 0,
    dailySessions: stats?.dailySessions ?? 0,
    loading,
    error
  };
};