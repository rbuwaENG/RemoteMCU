import { useState, useEffect } from "react";
import { subscribeToDevicesByOwner, Device } from "@/lib/firestore/devices";

export const useDevices = (ownerId: string | undefined) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToDevicesByOwner(ownerId, (fetchedDevices) => {
      // Map over devices and forcefully set them to offline if their heartbeat is stale (> 2 mins)
      const now = new Date().getTime();
      const updatedDevices = fetchedDevices.map(device => {
        let isStale = false;
        if (device.status === "online" && device.lastSeen?.toDate) {
          const lastSeenTime = device.lastSeen.toDate().getTime();
          // If it's been more than 2 minutes (120,000 ms) since last heartbeat, it's a dirty disconnect
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ownerId]);

  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === "online").length;
  const offlineDevices = devices.filter(d => d.status === "offline").length;

  return {
    devices,
    totalDevices,
    onlineDevices,
    offlineDevices,
    loading,
    error
  };
};