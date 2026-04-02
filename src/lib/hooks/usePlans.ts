import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export const usePlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const plansRef = doc(db, "plans", "default");
    
    const unsubscribe = onSnapshot(plansRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Plans are stored as an array in the document
          if (data.plans) {
            setPlans(data.plans);
          }
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

  return { plans, loading, error };
};

export const usePromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Would query promoCodes collection
    setLoading(false);
  }, []);

  return { promoCodes, loading };
};