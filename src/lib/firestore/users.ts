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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: "user" | "admin";
  credits: number;
  plan: string;
  deviceQuota: number;
  status: "active" | "suspended";
  createdAt: any;
  updatedAt: any;
  lastActiveAt: any;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { uid: userSnap.id, ...userSnap.data() } as UserProfile;
  }
  return null;
};

export const getUserProfiles = async (uids: string[]): Promise<Map<string, UserProfile>> => {
  const result = new Map<string, UserProfile>();
  for (const uid of uids) {
    const profile = await getUserProfile(uid);
    if (profile) {
      result.set(uid, profile);
    }
  }
  return result;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const updateUserCredits = async (uid: string, credits: number): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    credits,
    updatedAt: serverTimestamp()
  });
};

export const updateUserRole = async (uid: string, role: "user" | "admin"): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    role,
    updatedAt: serverTimestamp()
  });
};

export const updateUserStatus = async (uid: string, status: "active" | "suspended"): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    status,
    updatedAt: serverTimestamp()
  });
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const usersRef = collection(db, "users");
  const usersSnap = await getDocs(usersRef);
  return usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
};

export const getUsersByRole = async (role: "user" | "admin"): Promise<UserProfile[]> => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("role", "==", role));
  const usersSnap = await getDocs(q);
  return usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
};

export const createUserDocument = async (uid: string, data: Omit<UserProfile, "uid" | "createdAt" | "updatedAt">): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const deleteUser = async (uid: string): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await deleteDoc(userRef);
};