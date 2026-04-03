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

    let ownedDevices: Device[] = [];
    let sharedDevices: Device[] = [];

    const updateDevices = () => {
      const processedOwned = processDevices(ownedDevices);
      const processedShared = processDevices(sharedDevices);
      setDevices([...processedOwned, ...processedShared]);
      setLoading(false);
    };

    const unsubOwner = subscribeToDevicesByOwner(userId, (owned) => {
      ownedDevices = owned;
      updateDevices();
    });

    const unsubShared = subscribeToSharedDevices(userId, (shared) => {
      sharedDevices = shared;
      updateDevices();
    });

    return () => {
      unsubOwner();
      unsubShared();
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