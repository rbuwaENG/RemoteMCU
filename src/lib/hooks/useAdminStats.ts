"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, query, where, getDocs, orderBy, limit as fbLimit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GlobalStats, HourlyStats } from "@/lib/firestore/stats";
import { getAllDevices } from "@/lib/firestore/devices";
import { getAllUsers } from "@/lib/firestore/users";

export const useAdminStats = () => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeDevices, setActiveDevices] = useState(0);
  const [totalDevices, setTotalDevices] = useState(0);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // 1. Subscribe to Global Stats
    const statsRef = doc(db, "stats", "global");
    const unsubscribeStats = onSnapshot(statsRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as GlobalStats;
          setStats(data);
          setTotalUsers(data.totalUsers || 0);
          setTotalDevices(data.totalDevices || 0);
          setActiveDevices(data.activeDevices || 0);
        } else {
          // Manual Fallback if no global stats doc yet
          const users = await getAllUsers();
          const devices = await getAllDevices();
          
          const now = new Date().getTime();
          const online = devices.filter(d => {
            if (d.status !== "online") return false;
            if (d.lastSeen?.toDate) {
              const lastSeenTime = d.lastSeen.toDate().getTime();
              return (now - lastSeenTime) <= 120000; // 2 minutes
            }
            return true;
          }).length;
          
          setTotalUsers(users.length);
          setTotalDevices(devices.length);
          setActiveDevices(online);
        }
      },
      (err) => setError(err.message)
    );

    // 2. Fetch Recent Hourly Stats (Last 24 items)
    const hourlyRef = collection(db, "hourlyStats");
    const qHourly = query(hourlyRef, orderBy("date", "desc"), orderBy("hour", "desc"), fbLimit(24));
    
    const unsubscribeHourly = onSnapshot(qHourly, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HourlyStats));
      // Sort by hour ASC for the chart
      setHourlyStats(data.reverse());
      setLoading(false);
    });

    return () => {
      unsubscribeStats();
      unsubscribeHourly();
    };
  }, []);

  return {
    stats,
    totalUsers,
    activeDevices,
    totalDevices,
    monthlyRevenue: stats?.monthlyRevenue ?? 0,
    dailySessions: stats?.dailySessions ?? 0,
    hourlyStats,
    loading,
    error
  };
};