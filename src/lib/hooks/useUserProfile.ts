import { useState, useEffect } from "react";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/lib/firestore/users";

export const useUserProfile = (uid: string | undefined) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, "users", uid);
    
    const unsubscribe = onSnapshot(userRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const newProfile = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
          console.log("User profile updated:", newProfile.credits);
          setProfile(newProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching user profile:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return {
    profile,
    credits: profile?.credits ?? 0,
    plan: profile?.plan ?? "free",
    deviceQuota: profile?.deviceQuota ?? 0,
    role: profile?.role ?? "user",
    status: profile?.status ?? "active",
    loading,
    error
  };
};