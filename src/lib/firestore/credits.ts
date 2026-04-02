import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, Timestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CreditTransaction {
  id: string;
  userId: string;
  deviceId?: string;
  deviceName?: string;
  action: string;
  credits: number;
  type: "purchase" | "burn" | "refund" | "bonus";
  createdAt: Timestamp | Date;
}

export const burnCredits = async (
  userId: string, 
  creditsToBurn: number, 
  deviceId: string, 
  deviceName: string, 
  action: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userDoc.data();
    const currentCredits = userData.credits || 0;
    
    if (currentCredits < creditsToBurn) {
      throw new Error("Insufficient credits");
    }
    
    await updateDoc(userRef, {
      credits: increment(-creditsToBurn)
    });
    
    const transactionsRef = collection(db, "creditTransactions");
    await addDoc(transactionsRef, {
      userId,
      deviceId,
      deviceName,
      action,
      credits: -creditsToBurn,
      type: "burn",
      createdAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error("Error burning credits:", error);
    throw error;
  }
};

export const addCredits = async (
  userId: string,
  creditsToAdd: number,
  type: "purchase" | "bonus" | "refund" = "purchase",
  description: string = "Credit purchase"
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    
    await updateDoc(userRef, {
      credits: increment(creditsToAdd)
    });
    
    const transactionsRef = collection(db, "creditTransactions");
    await addDoc(transactionsRef, {
      userId,
      action: description,
      credits: creditsToAdd,
      type,
      createdAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error("Error adding credits:", error);
    throw error;
  }
};

export const getCreditTransactions = async (userId: string, limit: number = 20) => {
  const transactionsRef = collection(db, "creditTransactions");
  const q = query(
    transactionsRef, 
    where("userId", "==", userId), 
    orderBy("createdAt", "desc"),
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })).slice(0, limit) as CreditTransaction[];
};

export const subscribeToCreditTransactions = (userId: string, callback: (transactions: CreditTransaction[]) => void) => {
  const transactionsRef = collection(db, "creditTransactions");
  const q = query(
    transactionsRef, 
    where("userId", "==", userId), 
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CreditTransaction[];
    callback(transactions);
  });
};
