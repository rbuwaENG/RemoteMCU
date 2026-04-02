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
      await updateDoc(deviceRef, {
        sharedWith: [...sharedWith, userId]
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