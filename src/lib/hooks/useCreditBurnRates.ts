import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { defaultCreditBurnRates, CreditBurnRate } from "@/lib/firestore/plans";

export const useCreditBurnRates = () => {
  const [rates, setRates] = useState<CreditBurnRate[]>(defaultCreditBurnRates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const settingsRef = doc(db, "settings", "creditBurnRates");
    
    const unsubscribe = onSnapshot(settingsRef,
      async (docSnap) => {
        if (docSnap.exists() && docSnap.data().rates) {
          setRates(docSnap.data().rates);
        } else {
          // Initialize with defaults if not exists
          const burnSnap = await getDoc(settingsRef);
          if (!burnSnap.exists() || !burnSnap.data().rates) {
            await setDoc(settingsRef, { rates: defaultCreditBurnRates, updatedAt: new Date() }, { merge: true });
          }
          setRates(defaultCreditBurnRates);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching burn rates:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { rates, loading, error };
};