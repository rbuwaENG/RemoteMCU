import { 
  doc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  limit,
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  status: "committed" | "failed";
  timestamp: any;
}

export const createAdminLog = async (
  adminId: string,
  adminName: string,
  action: string,
  entity: string,
  entityId: string,
  description: string,
  status: "committed" | "failed" = "committed"
): Promise<string> => {
  const logsRef = collection(db, "adminLogs");
  const newDocRef = doc(logsRef);
  
  await setDoc(newDocRef, {
    adminId,
    adminName,
    action,
    entity,
    entityId,
    description,
    status,
    timestamp: serverTimestamp()
  });
  
  return newDocRef.id;
};

export const getRecentAdminLogs = async (limitCount: number = 20): Promise<AdminLog[]> => {
  const logsRef = collection(db, "adminLogs");
  const q = query(logsRef, orderBy("timestamp", "desc"), limit(limitCount));
  const logsSnap = await getDocs(q);
  return logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminLog));
};

export const getAdminLogsByEntity = async (entity: string, entityId: string): Promise<AdminLog[]> => {
  const logsRef = collection(db, "adminLogs");
  const q = query(
    logsRef, 
    orderBy("timestamp", "desc")
  );
  const logsSnap = await getDocs(q);
  return logsSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as AdminLog))
    .filter(log => log.entity === entity && log.entityId === entityId);
};

export const getAdminLogsByAdmin = async (adminId: string): Promise<AdminLog[]> => {
  const logsRef = collection(db, "adminLogs");
  const q = query(
    logsRef, 
    orderBy("timestamp", "desc")
  );
  const logsSnap = await getDocs(q);
  return logsSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as AdminLog))
    .filter(log => log.adminId === adminId);
};