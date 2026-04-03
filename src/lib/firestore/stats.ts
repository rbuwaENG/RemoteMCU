import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs,
  query,
  where,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

export interface GlobalStats {
  totalUsers: number;
  activeDevices: number;
  totalDevices: number;
  monthlyRevenue: number;
  dailySessions: number;
  totalTransactions: number;
  totalCreditsIssued: number;
  uptime: number;
}

export interface HourlyStats {
  id: string;
  date: string;
  hour: number;
  connectedDevices: number;
  serialSessions: number;
  flashUploads: number;
}

export const getGlobalStats = async (): Promise<GlobalStats> => {
  const statsRef = doc(db, "stats", "global");
  const statsSnap = await getDoc(statsRef);
  
  if (statsSnap.exists()) {
    return statsSnap.data() as GlobalStats;
  }
  
  return {
    totalUsers: 0,
    activeDevices: 0,
    totalDevices: 0,
    monthlyRevenue: 0,
    dailySessions: 0,
    totalTransactions: 0,
    totalCreditsIssued: 0,
    uptime: 99.9
  };
};

export const updateGlobalStats = async (data: Partial<GlobalStats>): Promise<void> => {
  const statsRef = doc(db, "stats", "global");
  await setDoc(statsRef, data, { merge: true });
};

export const incrementTotalUsers = async (): Promise<void> => {
  const statsRef = doc(db, "stats", "global");
  const stats = await getGlobalStats();
  await updateDoc(statsRef, {
    totalUsers: (stats.totalUsers || 0) + 1
  });
};

export const incrementActiveDevices = async (): Promise<void> => {
  const statsRef = doc(db, "stats", "global");
  const stats = await getGlobalStats();
  await updateDoc(statsRef, {
    activeDevices: (stats.activeDevices || 0) + 1
  });
};

export const addMonthlyRevenue = async (amount: number): Promise<void> => {
  const statsRef = doc(db, "stats", "global");
  const stats = await getGlobalStats();
  await updateDoc(statsRef, {
    monthlyRevenue: (stats.monthlyRevenue || 0) + amount
  });
};

export const getHourlyStats = async (date: string): Promise<HourlyStats[]> => {
  const hourlyRef = collection(db, "hourlyStats");
  const q = query(hourlyRef, where("date", "==", date));
  const hourlySnap = await getDocs(q);
  return hourlySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HourlyStats));
};

export const recordHourlyStats = async (
  date: string,
  hour: number,
  connectedDevices: number,
  serialSessions: number,
  flashUploads: number
): Promise<void> => {
  const hourlyRef = doc(db, "hourlyStats", `${date}-${hour}`);
  await setDoc(hourlyRef, {
    date,
    hour,
    connectedDevices,
    serialSessions,
    flashUploads,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const getMonthlyStats = async (): Promise<any> => {
  const monthlyRef = collection(db, "monthlyStats");
  const monthlySnap = await getDocs(monthlyRef);
  return monthlySnap.docs.map(doc => doc.data());
};

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

export const getMonthlyRevenueData = async (): Promise<MonthlyRevenueData[]> => {
  const monthlyRef = collection(db, "monthlyStats");
  const monthlySnap = await getDocs(monthlyRef);
  return monthlySnap.docs.map(doc => ({
    month: doc.id,
    revenue: doc.data().revenue || 0
  }));
};