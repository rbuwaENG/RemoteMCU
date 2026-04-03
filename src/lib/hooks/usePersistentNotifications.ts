import { useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNotifications } from "./useNotifications";

export const usePersistentNotifications = (userId: string | undefined) => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!userId) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("read", "==", false),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          
          // Trigger local toast notification
          addNotification(
            data.type || "info",
            data.title || "Notification",
            data.message || ""
          );

          // Mark as read immediately so it doesn't pop up again on refresh
          const docRef = doc(db, "notifications", change.doc.id);
          updateDoc(docRef, { read: true }).catch(console.error);
        }
      });
    });

    return () => unsubscribe();
  }, [userId, addNotification]);
};
