import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SupportTicket } from "@/lib/firestore/support";

export const useSupportTickets = (userId?: string) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const ticketsRef = collection(db, "supportTickets");
    let q = query(ticketsRef, orderBy("createdAt", "desc"));
    
    if (userId) {
      q = query(ticketsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    }

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const ticketsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as SupportTicket[];
        setTickets(ticketsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { tickets, loading, error };
};

export const useAllSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const ticketsRef = collection(db, "supportTickets");
    const q = query(ticketsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const ticketsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as SupportTicket[];
        setTickets(ticketsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { tickets, loading, error };
};
