import { useState, useEffect, useCallback } from "react";
import { subscribeToDevicesByOwner, subscribeToSharedDevices, Device } from "@/lib/firestore/devices";

export const useDevices = (userId: string | undefined) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const now = new Date().getTime();
    const processDevices = (devs: Device[]) => {
      return devs.map((device: Device) => {
        let isStale = false;
        if (device.status === "online" && device.lastSeen?.toDate) {
          const lastSeenTime = device.lastSeen.toDate().getTime();
          if (now - lastSeenTime > 120000) {
            isStale = true;
          }
        }
        return { ...device, status: isStale ? "offline" : device.status };
      });
    };

    const unsubOwner = subscribeToDevicesByOwner(userId, (owned) => {
      const processedOwned = processDevices(owned);
      
      const unsubShared = subscribeToSharedDevices(userId, (shared) => {
        const processedShared = processDevices(shared);
        setDevices([...processedOwned, ...processedShared]);
        setLoading(false);
        unsubShared();
      });
    });

    return () => {
      unsubOwner();
    };
  }, [userId, refreshKey]);

  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === "online").length;
  const offlineDevices = devices.filter(d => d.status === "offline").length;

  return {
    devices,
    totalDevices,
    onlineDevices,
    offlineDevices,
    loading,
    error,
    refresh
  };
};