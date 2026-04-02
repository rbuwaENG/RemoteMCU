import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ShareKey } from "@/lib/firestore/shareKeys";

export const useShareKey = (deviceId: string | undefined) => {
  const [shareKeys, setShareKeys] = useState<ShareKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const shareKeysRef = collection(db, "shareKeys");
    const q = query(shareKeysRef, where("deviceId", "==", deviceId), limit(10));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const keys = snapshot.docs.map(doc => doc.data() as ShareKey);
        setShareKeys(keys);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [deviceId]);

  const activeKey = shareKeys.find(k => !k.revoked && (!k.expiresAt || k.expiresAt.toDate ? k.expiresAt.toDate() > new Date() : true));

  return {
    shareKeys,
    activeKey,
    loading,
    error
  };
};