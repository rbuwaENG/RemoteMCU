import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
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
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().rates) {
          setRates(docSnap.data().rates);
        } else {
          setRates(defaultCreditBurnRates);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { rates, loading, error };
};