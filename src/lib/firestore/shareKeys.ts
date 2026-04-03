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
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

export interface ShareKey {
  id: string;
  key: string;
  deviceId: string;
  ownerId: string;
  grantedTo: string | null;
  expiresAt: any;
  createdAt: any;
  revoked: boolean;
}

const generateShareKey = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createShareKey = async (
  deviceId: string, 
  ownerId: string, 
  expiresInHours: number = 24
): Promise<string> => {
  const shareKeysRef = collection(db, "shareKeys");
  const newDocRef = doc(shareKeysRef);
  const key = generateShareKey();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  await setDoc(newDocRef, {
    key,
    deviceId,
    ownerId,
    grantedTo: null,
    expiresAt,
    createdAt: serverTimestamp(),
    revoked: false
  });

  return key;
};

export const getShareKeyById = async (keyId: string): Promise<ShareKey | null> => {
  const keyRef = doc(db, "shareKeys", keyId);
  const keySnap = await getDoc(keyRef);
  if (keySnap.exists()) {
    return { id: keySnap.id, ...keySnap.data() } as ShareKey;
  }
  return null;
};

export const validateShareKey = async (key: string): Promise<ShareKey | null> => {
  const shareKeysRef = collection(db, "shareKeys");
  const q = query(shareKeysRef, where("key", "==", key));
  const keySnap = await getDocs(q);
  
  if (keySnap.empty) return null;
  
  const keyDoc = keySnap.docs[0];
  const keyData = keyDoc.data() as Omit<ShareKey, 'id'>;
  
  if (keyData.revoked) return null;
  
  if (keyData.expiresAt) {
    try {
      let expiryDate: Date;
      if (keyData.expiresAt && typeof keyData.expiresAt === 'object' && 'seconds' in keyData.expiresAt) {
        expiryDate = new Date(keyData.expiresAt.seconds * 1000);
      } else if (keyData.expiresAt.toDate) {
        expiryDate = keyData.expiresAt.toDate();
      } else {
        expiryDate = new Date(keyData.expiresAt);
      }
      if (expiryDate < new Date()) return null;
    } catch (e) {
      console.error("Error checking expiry:", e);
    }
  }
  
  return { id: keyDoc.id, ...keyData };
};

export const redeemShareKey = async (keyId: string, userId: string): Promise<void> => {
  const keyRef = doc(db, "shareKeys", keyId);
  await updateDoc(keyRef, {
    grantedTo: userId,
    redeemedAt: serverTimestamp()
  });
};

export const revokeShareKey = async (keyId: string): Promise<void> => {
  const keyRef = doc(db, "shareKeys", keyId);
  await updateDoc(keyRef, {
    revoked: true,
    revokedAt: serverTimestamp()
  });
};

export const getShareKeysByDevice = async (deviceId: string): Promise<ShareKey[]> => {
  const shareKeysRef = collection(db, "shareKeys");
  const q = query(shareKeysRef, where("deviceId", "==", deviceId));
  const keysSnap = await getDocs(q);
  return keysSnap.docs.map(doc => doc.data() as ShareKey);
};

export const getShareKeysByOwner = async (ownerId: string): Promise<ShareKey[]> => {
  const shareKeysRef = collection(db, "shareKeys");
  const q = query(shareKeysRef, where("ownerId", "==", ownerId));
  const keysSnap = await getDocs(q);
  return keysSnap.docs.map(doc => doc.data() as ShareKey);
};

export const deleteShareKey = async (keyId: string): Promise<void> => {
  const keyRef = doc(db, "shareKeys", keyId);
  await deleteDoc(keyRef);
};