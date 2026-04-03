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
  serverTimestamp,
  increment,
  addDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { burnCredits } from "./credits";

async function addPersistentNotification(userId: string, title: string, message: string, type: "info" | "warning" | "error" | "success" = "info") {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      title,
      message,
      type,
      read: false,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to add persistent notification:", error);
  }
}

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
  maxSharedUsers?: number;
  code?: string;
  setupToken?: string;
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

export const generateSetupToken = async (deviceId: string): Promise<string> => {
  const token = `RMCU-${Date.now().toString(36).toUpperCase()}`;
  const deviceRef = doc(db, "devices", deviceId);
  await updateDoc(deviceRef, { setupToken: token });
  return token;
};

export const getSetupToken = async (deviceId: string): Promise<string | null> => {
  const device = await getDevice(deviceId);
  return device?.setupToken || null;
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

export const addSharedUser = async (deviceId: string, userId: string): Promise<{ success: boolean; message?: string }> => {
  console.log("addSharedUser called:", deviceId, userId);
  const deviceRef = doc(db, "devices", deviceId);
  const device = await getDevice(deviceId);
  if (device) {
    const sharedWith = device.sharedWith || [];
    
    if (sharedWith.includes(userId)) {
      return { success: true };
    }
    
    const ownerRef = doc(db, "users", device.ownerId);
    console.log("Fetching owner:", device.ownerId);
    const ownerSnap = await getDoc(ownerRef);
    console.log("Owner exists:", ownerSnap.exists());
    
    let maxSharedUsers = 1;
    if (ownerSnap.exists()) {
      const ownerData = ownerSnap.data() as any;
      const planId = ownerData.plan;
      console.log("Owner planId:", planId);
      if (planId) {
        const plansRef = doc(db, "plans", "default");
        console.log("Fetching plans from: plans/default");
        const plansSnap = await getDoc(plansRef);
        console.log("Plans exists:", plansSnap.exists());
        if (plansSnap.exists()) {
          const plansData = plansSnap.data() as any;
          if (plansData.plans) {
            const plan = plansData.plans.find((p: any) => p.id === planId);
            if (plan) {
              maxSharedUsers = plan.maxSharedUsers ?? 1;
              console.log("maxSharedUsers from plan:", maxSharedUsers);
            }
          }
        }
      }
    }
    
    const totalPotentialUsers = sharedWith.length;
    console.log("currentSharedUsers:", totalPotentialUsers, "maxSharedUsers:", maxSharedUsers);
    
    if (maxSharedUsers > 0 && (totalPotentialUsers + 1) > maxSharedUsers) {
      return { 
        success: false, 
        message: `Your current plan allows ${maxSharedUsers} shared users. Please upgrade your plan or remove existing shared users.` 
      };
    }
    
    console.log("Updating device with shared user...");
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
    
    // Burn credits for creating a shared session
    // 1 credit per hour of session time (minimum 1 credit)
    const sessionHours = Math.max(1, device.sessionDurationMinutes ? device.sessionDurationMinutes / 60 : 1);
    const creditsToBurn = Math.ceil(sessionHours); // Round up to nearest whole credit
    try {
      // 1. Charge the owner
      await burnCredits(
        device.ownerId, // CHARGE OWNER
        creditsToBurn, 
        deviceId, 
        device.name || 'Unknown Device', 
        `Shared session created (${device.sessionDurationMinutes} min limit)`
      );
      console.log(`Burned ${creditsToBurn} credits from owner: ${device.ownerId}`);

      // 2. Add a receipt for the Guest (0 credits) so they see it in their log
      const transactionsRef = collection(db, "creditTransactions");
      await addDoc(transactionsRef, {
        userId: userId, // Log for the Guest
        deviceId,
        deviceName: device.name || 'Unknown Device',
        action: `Joined shared session (${device.sessionDurationMinutes} min limit)`,
        credits: 0,
        type: "burn",
        createdAt: Timestamp.now()
      });
      console.log(`Added log entry for guest: ${userId}`);

    } catch (burnError) {
      console.error("Failed to burn credits from owner or log for guest:", burnError);
      // Don't fail the whole operation if credit burning/logging fails
    }
    
    console.log("Device updated with shared user");
    
    return { success: true };
  }
  return { success: false, message: "Device not found" };
};

export const removeSharedUser = async (deviceId: string, userId: string): Promise<void> => {
  const deviceRef = doc(db, "devices", deviceId);
  const device = await getDevice(deviceId);
  if (device) {
    const sharedWith = device.sharedWith || [];
    const sharedAccess = { ...(device.sharedAccess || {}) };
    delete sharedAccess[userId];
    
    await updateDoc(deviceRef, {
      sharedWith: sharedWith.filter(id => id !== userId),
      sharedAccess: sharedAccess
    });

    // Send persistent notification to the revoked user
    await addPersistentNotification(
      userId,
      "Access Revoked",
      `The owner has revoked your access to ${device.name || 'the device'}.`,
      "warning"
    );
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

  // Send persistent notification if a session was actually removed
  await addPersistentNotification(
    userId,
    "Session Terminated",
    `Your active session on ${device?.name || 'the device'} has been terminated by the owner.`,
    "error"
  );
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
  
  // Get the target user's info for notification
  const targetUserRef = doc(db, "users", userId);
  const targetUserSnap = await getDoc(targetUserRef);
  const targetUserName = targetUserSnap.exists() 
    ? (targetUserSnap.data() as any).displayName || (targetUserSnap.data() as any).email || 'User'
    : 'User';
  
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
  
  // Send notification to the user whose access was revoked
  try {
    await addPersistentNotification(
      userId,
      "Access Revoked",
      `The owner has revoked your access to ${device.name || 'the device'}.`,
      "warning"
    );
    console.log(`Sent access revoked notification to user ${userId}`);
  } catch (notifyError) {
    console.error("Failed to send access revoked notification:", notifyError);
  }
  
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