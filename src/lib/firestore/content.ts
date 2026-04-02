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

export interface SiteContent {
  hero: {
    title: string;
    subtext: string;
  };
  features: {
    title: string;
    description: string;
    icon: string;
  }[];
  about: {
    story: string;
    mission: string;
  };
  socialLinks: {
    discord: string;
    buymeacoffee: string;
  };
  architects: {
    name: string;
    title: string;
    bio: string;
    image: string;
  }[];
  updatedAt: any;
  updatedBy: string;
}

export const getSiteContent = async (): Promise<SiteContent | null> => {
  const contentRef = doc(db, "siteContent", "main");
  const contentSnap = await getDoc(contentRef);
  if (contentSnap.exists()) {
    return contentSnap.data() as SiteContent;
  }
  return null;
};

export const updateSiteContent = async (data: Partial<SiteContent>, adminId: string): Promise<void> => {
  const contentRef = doc(db, "siteContent", "main");
  const contentSnap = await getDoc(contentRef);
  
  if (contentSnap.exists()) {
    await updateDoc(contentRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: adminId
    });
  } else {
    await setDoc(contentRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: adminId
    });
  }
};

export const createSiteContent = async (data: Omit<SiteContent, "updatedAt" | "updatedBy">): Promise<void> => {
  const contentRef = doc(db, "siteContent", "main");
  await setDoc(contentRef, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: ""
  });
};

export interface PromoCode {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  applicablePlans: string[];
  maxRedemptions: number;
  redemptionCount: number;
  status: "active" | "paused" | "expired";
  expiresAt: any;
}

export const getAllPromoCodes = async (): Promise<PromoCode[]> => {
  const promoRef = collection(db, "promoCodes");
  const promoSnap = await getDocs(promoRef);
  return promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode));
};

export const getPromoCodeByCode = async (code: string): Promise<PromoCode | null> => {
  const promoRef = collection(db, "promoCodes");
  const promoSnap = await getDocs(promoRef);
  const promo = promoSnap.docs.find(doc => doc.data().code === code);
  if (promo) {
    return { id: promo.id, ...promo.data() } as PromoCode;
  }
  return null;
};

export const createPromoCode = async (promoData: Omit<PromoCode, "id">): Promise<string> => {
  const promoRef = collection(db, "promoCodes");
  const newDocRef = doc(promoRef);
  await setDoc(newDocRef, promoData);
  return newDocRef.id;
};

export const updatePromoCode = async (promoId: string, data: Partial<PromoCode>): Promise<void> => {
  const promoRef = doc(db, "promoCodes", promoId);
  await updateDoc(promoRef, data);
};

export const deletePromoCode = async (promoId: string): Promise<void> => {
  const promoRef = doc(db, "promoCodes", promoId);
  await deleteDoc(promoRef);
};