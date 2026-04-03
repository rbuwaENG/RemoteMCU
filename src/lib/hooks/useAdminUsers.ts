"use client";

import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit as fbLimit, onSnapshot, startAfter, QueryConstraint, DocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/lib/firestore/users";

export const useAdminUsers = (pageSize: number = 20) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = (reset: boolean = false) => {
    setLoading(true);
    
    const usersRef = collection(db, "users");
    const constraints: QueryConstraint[] = [
      orderBy("createdAt", "desc"),
      fbLimit(pageSize)
    ];
    
    if (!reset && lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    const q = query(usersRef, ...constraints);

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const newUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setUsers((prev: UserProfile[]) => reset ? newUsers : [...prev, ...newUsers]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === pageSize);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  };

  useEffect(() => {
    const unsubscribe = fetchUsers(true);
    return () => unsubscribe();
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchUsers(false);
    }
  };

  const refresh = () => {
    setLastDoc(null);
    fetchUsers(true);
  };

  return {
    users,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};