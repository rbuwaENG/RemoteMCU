import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  description: string;
  category: "bug" | "feature" | "billing" | "technical" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface TicketMessage {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  message: string;
  isStaff: boolean;
  createdAt: Timestamp | Date;
}

export const createSupportTicket = async (ticket: Omit<SupportTicket, "id" | "createdAt" | "updatedAt" | "messages">) => {
  const ticketsRef = collection(db, "supportTickets");
  const now = Timestamp.now();
  
  const docRef = await addDoc(ticketsRef, {
    ...ticket,
    messages: [],
    createdAt: now,
    updatedAt: now,
  });
  
  return docRef.id;
};

export const addTicketMessage = async (ticketId: string, message: Omit<TicketMessage, "id" | "createdAt">) => {
  const ticketRef = doc(db, "supportTickets", ticketId);
  const ticketDoc = await getDoc(ticketRef);
  
  if (!ticketDoc.exists()) {
    throw new Error("Ticket not found");
  }
  
  const ticketData = ticketDoc.data() as SupportTicket;
  const newMessage = {
    ...message,
    id: `msg_${Date.now()}`,
    createdAt: Timestamp.now(),
  };
  
  await updateDoc(ticketRef, {
    messages: [...(ticketData.messages || []), newMessage],
    updatedAt: Timestamp.now(),
  });
};

export const updateTicketStatus = async (ticketId: string, status: SupportTicket["status"], assignedTo?: string) => {
  const ticketRef = doc(db, "supportTickets", ticketId);
  const updateData: Partial<SupportTicket> = {
    status,
    updatedAt: Timestamp.now(),
  };
  
  if (assignedTo) {
    updateData.assignedTo = assignedTo;
  }
  
  await updateDoc(ticketRef, updateData);
};

export const getSupportTickets = async (userId?: string) => {
  const ticketsRef = collection(db, "supportTickets");
  let q = query(ticketsRef, orderBy("createdAt", "desc"));
  
  if (userId) {
    q = query(ticketsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SupportTicket[];
};

export const getAllSupportTickets = async () => {
  const ticketsRef = collection(db, "supportTickets");
  const q = query(ticketsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SupportTicket[];
};
