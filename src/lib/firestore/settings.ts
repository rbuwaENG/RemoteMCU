import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";

export interface SiteSettings {
  siteName: string;
  siteUrl: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerification: boolean;
  maxDevicesPerUser: number;
  defaultPlan: string;
  apiRateLimit: number;
  sessionTimeout: number;
  webhookUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpFrom: string;
  updatedAt?: any;
  updatedBy?: string;
}

const SETTINGS_DOC_PATH = "settings/global";

export const getSiteSettings = async (): Promise<SiteSettings | null> => {
  try {
    const settingsRef = doc(db, SETTINGS_DOC_PATH);
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      return docSnap.data() as SiteSettings;
    }
    return null;
  } catch (error) {
    console.error("Error fetching site settings:", error);
    throw error;
  }
};

export const updateSiteSettings = async (settings: Partial<SiteSettings>, userId: string) => {
  try {
    const settingsRef = doc(db, SETTINGS_DOC_PATH);
    const docSnap = await getDoc(settingsRef);
    
    const updateData = {
      ...settings,
      updatedAt: Timestamp.now(),
      updatedBy: userId
    };

    if (docSnap.exists()) {
      await updateDoc(settingsRef, updateData);
    } else {
      await setDoc(settingsRef, updateData);
    }
  } catch (error) {
    console.error("Error updating site settings:", error);
    throw error;
  }
};
