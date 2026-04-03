"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit as fbLimit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminLog } from "@/lib/firestore/adminLogs";

export const useAdminLogs = (limitCount: number = 20) => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const logsRef = collection(db, "adminLogs");
    const q = query(logsRef, orderBy("timestamp", "desc"), fbLimit(limitCount));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const newLogs = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as AdminLog));
        setLogs(newLogs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limitCount]);

  return { logs, loading, error };
};
