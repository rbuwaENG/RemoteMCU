import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

export interface Device {
  id: string;
  name: string;
  board: string;
  ownerId: string;
  status: "online" | "offline" | "error";
  port: string;
  ip: string | null;
  agentVersion: string;
  lastSeen: any;
  createdAt: any;
  sharedWith: string[];
  code?: string;
  activeSessions?: {
    userId: string;
    displayName: string;
    email: string;
    connectedAt: any;
    expiresAt?: any;
  }[];
  sessionDurationMinutes?: number;
  sharedAccess?: {
    [userId: string]: {
      sharedAt: any;
      expiresAt?: any;
    }
  };
}

export const getDevice = async (deviceId: string): Promise<Device | null> => {
  const deviceRef = doc(db, "devices", deviceId);
  const deviceSnap = await getDoc(deviceRef);
  if (deviceSnap.exists()) {
    return { id: deviceSnap.id, ...deviceSnap.data() } as Device;
  }
  return null;
};

export const getDevicesByOwner = async (ownerId: string): Promise<Device[]> => {
  const devicesRef = collection(db, "devices");
  const q = query(devicesRef, where("ownerId", "==", ownerId));
  const devicesSnap = await getDocs(q);
  return devicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
};

export const getSharedDevices = async (userId: string): Promise<Device[]> => {
  const devicesRef = collection(db, "devices");
  const q = query(devicesRef, where("sharedWith", "array-contains", userId));
  const devicesSnap = await getDocs(q);
  return devicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
};

export const createDevice = async (deviceData: Omit<Device, "id" | "createdAt" | "lastSeen">): Promise<string> => {
  const devicesRef = collection(db, "devices");
  const newDocRef = doc(devicesRef);
  await setDoc(newDocRef, {
    ...deviceData,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp()
  });
  return newDocRef.id;
};

export const updateDevice = async (deviceId: string, data: Partial<Device>): Promise<void> => {
  const deviceRef = doc(db, "devices", deviceId);
  await updateDoc(deviceRef, data);
};

export const updateDeviceStatus = async (deviceId: string, status: "online" | "offline" | "error"): Promise<void> => {
  const deviceRef = doc(db, "devices", deviceId);
  await updateDoc(deviceRef, {
    status,
    lastSeen: serverTimestamp()
  });
};

export const deleteDevice = async (deviceId: string): Promise<void> => {
  const deviceRef = doc(db, "devices", deviceId);
  await deleteDoc(deviceRef);
};

export const addSharedUser = async (deviceId: string, userId: string): Promise<void> => {
  const deviceRef = doc(db, "devices", deviceId);
  const device = await getDevice(deviceId);
  if (device) {
    const sharedWith = device.sharedWith || [];
    if (!sharedWith.includes(userId)) {
      const now = new Date();
      const expiresAt = device.sessionDurationMinutes && device.sessionDurationMinutes > 0
        ? new Date(now.getTime() + device.sessionDurationMinutes * 60000)
        : null;
      
      const sharedAccess = device.sharedAccess || {};
      sharedAccess[userId] = {
        sharedAt: now,
        expiresAt: expiresAt
      };
      
      await updateDoc(deviceRef, {
        sharedWith: [...sharedWith, userId],
        sharedAccess: sharedAccess
      });
    }
  }
};

export const removeSharedUser = async (deviceId: string, userId: string): Promise<void> => {
  const deviceRef = doc(db, "devices", deviceId);
  const device = await getDevice(deviceId);
  if (device) {
    const sharedWith = device.sharedWith || [];
    await updateDoc(deviceRef, {
      sharedWith: sharedWith.filter(id => id !== userId)
    });
  }
};

export const getAllDevices = async (): Promise<Device[]> => {
  const devicesRef = collection(db, "devices");
  const devicesSnap = await getDocs(devicesRef);
  return devicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
};

export const getOnlineDevicesCount = async (): Promise<number> => {
  const devicesRef = collection(db, "devices");
  const q = query(devicesRef, where("status", "==", "online"));
  const devicesSnap = await getDocs(q);
  return devicesSnap.size;
};

export const subscribeToDevicesByOwner = (
  ownerId: string, 
  callback: (devices: Device[]) => void
): Unsubscribe => {
  const devicesRef = collection(db, "devices");
  const q = query(devicesRef, where("ownerId", "==", ownerId));
  return onSnapshot(q, (snapshot) => {
    const devices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
    callback(devices);
  });
};

export const subscribeToSharedDevices = (
  userId: string, 
  callback: (devices: Device[]) => void
): Unsubscribe => {
  const devicesRef = collection(db, "devices");
  const q = query(devicesRef, where("sharedWith", "array-contains", userId));
  return onSnapshot(q, (snapshot) => {
    const devices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
    callback(devices);
  });
};

export const subscribeToAllDevices = (
  callback: (devices: Device[]) => void
): Unsubscribe => {
  const devicesRef = collection(db, "devices");
  const q = query(devicesRef, orderBy("lastSeen", "desc"));
  return onSnapshot(q, (snapshot) => {
    const devices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
    callback(devices);
  });
};

export const subscribeToDevice = (
  deviceId: string,
  callback: (device: Device | null) => void
): Unsubscribe => {
  const deviceRef = doc(db, "devices", deviceId);
  return onSnapshot(deviceRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Device);
    } else {
      callback(null);
    }
  });
};

export const sendSerialCommand = async (deviceId: string, command: string): Promise<void> => {
  const deviceRef = doc(db, "devices", deviceId);
  await updateDoc(deviceRef, {
    lastCommand: command,
    lastCommandAt: serverTimestamp()
  });
};

export const addActiveSession = async (
  deviceId: string, 
  session: {
    userId: string;
    displayName: string;
    email: string;
    connectedAt: any;
    expiresAt?: Date;
  }
): Promise<void> => {
  const deviceRef = doc(db, "devices", deviceId);
  const device = await getDevice(deviceId);
  const sessions = device?.activeSessions || [];
  
  const existingIndex = sessions.findIndex(s => s.userId === session.userId);
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }
  
  await updateDoc(deviceRef, { activeSessions: sessions });
};

export const removeActiveSession = async (deviceId: string, userId: string): Promise<void> => {
  const deviceRef = doc(db, "devices", deviceId);
  const device = await getDevice(deviceId);
  const sessions = (device?.activeSessions || []).filter(s => s.userId !== userId);
  await updateDoc(deviceRef, { activeSessions: sessions });
};

export const getActiveSessions = async (deviceId: string): Promise<Device['activeSessions']> => {
  const device = await getDevice(deviceId);
  return device?.activeSessions || [];
};

export const clearExpiredSessions = async (deviceId: string): Promise<void> => {
  const device = await getDevice(deviceId);
  if (!device?.activeSessions) return;
  
  const now = new Date();
  const validSessions = device.activeSessions.filter(s => {
    if (s.expiresAt) {
      const expiry = s.expiresAt.toDate ? s.expiresAt.toDate() : new Date(s.expiresAt.seconds * 1000);
      return expiry > now;
    }
    return true;
  });
  
  if (validSessions.length !== device.activeSessions.length) {
    const deviceRef = doc(db, "devices", deviceId);
    await updateDoc(deviceRef, { activeSessions: validSessions });
  }
};

export const setSessionDuration = async (deviceId: string, minutes: number): Promise<void> => {
  const deviceRef = doc(db, "devices", deviceId);
  await updateDoc(deviceRef, { sessionDurationMinutes: minutes });
};

export const leaveSharedDevice = async (deviceId: string, userId: string): Promise<void> => {
  console.log("Leaving device:", deviceId, "user:", userId);
  const deviceRef = doc(db, "devices", deviceId);
  const device = await getDevice(deviceId);
  if (!device) {
    console.log("Device not found");
    return;
  }
  
  console.log("Current sharedWith:", device.sharedWith);
  console.log("Current activeSessions:", device.activeSessions);
  
  const newSharedWith = (device.sharedWith || []).filter(id => id !== userId);
  const newActiveSessions = (device.activeSessions || []).filter(s => s.userId !== userId);
  
  const newSharedAccess = { ...(device.sharedAccess || {}) };
  delete newSharedAccess[userId];
  
  console.log("New sharedWith:", newSharedWith);
  console.log("New activeSessions:", newActiveSessions);
  
  await updateDoc(deviceRef, {
    sharedWith: newSharedWith,
    activeSessions: newActiveSessions,
    sharedAccess: newSharedAccess
  });
  console.log("Successfully left device");
};

export const cleanExpiredSessions = async (deviceId: string): Promise<void> => {
  const device = await getDevice(deviceId);
  if (!device) return;
  
  const now = new Date();
  const validSessions: Device['activeSessions'] = [];
  const expiredUserIds: string[] = [];
  
  if (device.activeSessions) {
    for (const session of device.activeSessions) {
      let isExpired = false;
      if (session.expiresAt) {
        try {
          const expiryDate = session.expiresAt.toDate ? session.expiresAt.toDate() : new Date(session.expiresAt.seconds * 1000);
          if (expiryDate < now) {
            isExpired = true;
            expiredUserIds.push(session.userId);
          }
        } catch (e) {
          console.error("Error checking expiry:", e);
        }
      }
      if (!isExpired) {
        validSessions.push(session);
      }
    }
  }
  
  let updatedSharedWith = device.sharedWith || [];
  
  if (expiredUserIds.length > 0 && device.sessionDurationMinutes && device.sessionDurationMinutes > 0) {
    updatedSharedWith = updatedSharedWith.filter(uid => !expiredUserIds.includes(uid));
  }
  
  if (validSessions.length !== (device.activeSessions?.length || 0) || 
      updatedSharedWith.length !== (device.sharedWith?.length || 0)) {
    const deviceRef = doc(db, "devices", deviceId);
    await updateDoc(deviceRef, { 
      activeSessions: validSessions,
      sharedWith: updatedSharedWith
    });
  }
};