import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

export interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  deviceQuota: number;
  maxSharedUsers: number;
  features: string[];
  popular: boolean;
  active: boolean;
  showOnLanding?: boolean;
}

export interface CreditBurnRate {
  id: string;
  name: string;
  description: string;
  creditsPerUnit: number;
  unit: string;
  category: "upload" | "serial" | "camera" | "api" | "storage";
  active: boolean;
}

export const defaultCreditBurnRates: CreditBurnRate[] = [
  { id: "session_per_hour", name: "Session Time", description: "Credits burned per hour of active session", creditsPerUnit: 1, unit: "per hour", category: "serial", active: true },
  { id: "ota_upload", name: "OTA Firmware Upload", description: "Credits burned per firmware upload via OTA", creditsPerUnit: 5, unit: "per MB", category: "upload", active: true },
  { id: "serial_monitor", name: "Serial Monitor", description: "Credits burned for serial monitor data streaming", creditsPerUnit: 1, unit: "per 1000 chars", category: "serial", active: true },
  { id: "camera_stream", name: "Camera Stream", description: "Credits burned for live camera feed", creditsPerUnit: 10, unit: "per minute", category: "camera", active: true },
  { id: "file_transfer", name: "File Transfer", description: "Credits burned for file uploads/downloads", creditsPerUnit: 2, unit: "per MB", category: "upload", active: true },
  { id: "api_calls", name: "API Calls", description: "Credits burned for REST API requests", creditsPerUnit: 0.1, unit: "per request", category: "api", active: true },
  { id: "cloud_storage", name: "Cloud Storage", description: "Credits burned for cloud data storage", creditsPerUnit: 1, unit: "per MB/day", category: "storage", active: true },
];

export const getPlan = async (planId: string): Promise<Plan | null> => {
  const planRef = doc(db, "plans", planId);
  const planSnap = await getDoc(planRef);
  if (planSnap.exists()) {
    return { id: planSnap.id, ...planSnap.data() } as Plan;
  }
  return null;
};

export const getAllPlans = async (): Promise<Plan[]> => {
  const plansRef = collection(db, "plans");
  const plansSnap = await getDocs(plansRef);
  return plansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
};

export const getActivePlans = async (): Promise<Plan[]> => {
  const plansRef = collection(db, "plans");
  const plansSnap = await getDocs(plansRef);
  return plansSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Plan))
    .filter(plan => plan.active);
};

export const createPlan = async (planData: Omit<Plan, "id">): Promise<string> => {
  const plansRef = collection(db, "plans");
  const newDocRef = doc(plansRef);
  await setDoc(newDocRef, planData);
  return newDocRef.id;
};

export const updatePlan = async (planId: string, data: Partial<Plan>): Promise<void> => {
  const planRef = doc(db, "plans", planId);
  await updateDoc(planRef, data);
};

export const deletePlan = async (planId: string): Promise<void> => {
  const planRef = doc(db, "plans", planId);
  await deleteDoc(planRef);
};

export const togglePlanActive = async (planId: string, active: boolean): Promise<void> => {
  const planRef = doc(db, "plans", planId);
  await updateDoc(planRef, { active });
};

export const setPopularPlan = async (planId: string, popular: boolean): Promise<void> => {
  const planRef = doc(db, "plans", planId);
  await updateDoc(planRef, { popular });
};

export const getCreditBurnRates = async (): Promise<CreditBurnRate[]> => {
  const burnRef = doc(db, "settings", "creditBurnRates");
  const burnSnap = await getDoc(burnRef);
  if (burnSnap.exists()) {
    return burnSnap.data().rates || defaultCreditBurnRates;
  }
  return defaultCreditBurnRates;
};

export const updateCreditBurnRates = async (rates: CreditBurnRate[]): Promise<void> => {
  const burnRef = doc(db, "settings", "creditBurnRates");
  await setDoc(burnRef, { rates, updatedAt: serverTimestamp() }, { merge: true });
};

export const updateCreditBurnRate = async (rateId: string, data: Partial<CreditBurnRate>): Promise<void> => {
  const burnRef = doc(db, "settings", "creditBurnRates");
  const burnSnap = await getDoc(burnRef);
  let rates: CreditBurnRate[] = defaultCreditBurnRates;
  
  if (burnSnap.exists() && burnSnap.data().rates) {
    rates = burnSnap.data().rates;
  }
  
  const updatedRates = rates.map(r => r.id === rateId ? { ...r, ...data } : r);
  await setDoc(burnRef, { rates: updatedRates, updatedAt: serverTimestamp() }, { merge: true });
};