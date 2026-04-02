"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useAllSupportTickets } from "@/lib/hooks/useSupportTickets";
import { updateTicketStatus, SupportTicket } from "@/lib/firestore/support";
import Link from "next/link";

export default function AdminTicketsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { tickets, loading: ticketsLoading, error } = useAllSupportTickets();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, authLoading, router]);

  const filteredTickets = tickets.filter(ticket => {
    if (filter === "all") return true;
    return ticket.status === filter;
  });

  const handleStatusChange = async (ticketId: string, newStatus: SupportTicket["status"]) => {
    try {
      setSending(true);
      await updateTicketStatus(ticketId, newStatus);
      setSending(false);
    } catch (err) {
      console.error("Error updating ticket:", err);
      setSending(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-error/20 text-error";
      case "high": return "bg-warning/20 text-warning";
      case "medium": return "bg-primary/20 text-primary";
      default: return "bg-surface-container-high text-on-surface-variant";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-error/20 text-error";
      case "in_progress": return "bg-primary/20 text-primary";
      case "resolved": return "bg-success/20 text-success";
      case "closed": return "bg-surface-container-high text-on-surface-variant";
      default: return "bg-surface-container-high text-on-surface-variant";
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface mb-1">Support Tickets</h1>
          <p className="text-on-surface-variant font-mono text-xs uppercase tracking-widest">Manage and respond to user support requests</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 text-xs font-mono bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg focus:border-primary focus:outline-none"
          >
            <option value="all">All Tickets</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tickets List */}
        <div className="lg:col-span-1 bg-surface-container-low rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-surface-container-high/50 border-b border-outline-variant/10">
            <h3 className="text-sm font-bold text-on-surface">Tickets ({filteredTickets.length})</h3>
          </div>
          <div className="divide-y divide-outline-variant/10 max-h-[600px] overflow-y-auto">
            {ticketsLoading ? (
              <div className="p-6 text-center text-on-surface-variant">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant">No tickets found</div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 cursor-pointer hover:bg-surface-container-high transition-colors ${
                    selectedTicket?.id === ticket.id ? "bg-surface-container-high border-l-2 border-primary" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-on-surface mb-1 truncate">{ticket.subject}</h4>
                  <p className="text-xs text-on-surface-variant mb-2">{ticket.userName}</p>
                  <p className="text-[10px] text-on-surface-variant/60">{formatDate(ticket.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-xl overflow-hidden">
          {selectedTicket ? (
            <>
              <div className="px-6 py-4 bg-surface-container-high/50 border-b border-outline-variant/10 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">{selectedTicket.subject}</h3>
                  <p className="text-xs text-on-surface-variant">
                    {selectedTicket.userName} ({selectedTicket.userEmail}) • {formatDate(selectedTicket.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedTicket.status === "open" && (
                    <button 
                      onClick={() => handleStatusChange(selectedTicket.id, "in_progress")}
                      disabled={sending}
                      className="px-3 py-1.5 text-xs font-mono bg-primary/20 text-primary hover:bg-primary/30 rounded transition-colors disabled:opacity-50"
                    >
                      Start Work
                    </button>
                  )}
                  {selectedTicket.status === "in_progress" && (
                    <button 
                      onClick={() => handleStatusChange(selectedTicket.id, "resolved")}
                      disabled={sending}
                      className="px-3 py-1.5 text-xs font-mono bg-success/20 text-success hover:bg-success/30 rounded transition-colors disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {selectedTicket.status === "resolved" && (
                    <button 
                      onClick={() => handleStatusChange(selectedTicket.id, "closed")}
                      disabled={sending}
                      className="px-3 py-1.5 text-xs font-mono bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest rounded transition-colors disabled:opacity-50"
                    >
                      Close Ticket
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="bg-surface-container-high p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed">{selectedTicket.description}</p>
                </div>

                {/* Messages */}
                {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">Conversation</h4>
                    {selectedTicket.messages.map((msg, idx) => (
                      <div key={idx} className={`p-4 rounded-lg ${msg.isStaff ? "bg-primary/10 ml-8" : "bg-surface-container-high mr-8"}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-on-surface">{msg.userName}</span>
                          <span className="text-[10px] text-on-surface-variant">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm text-on-surface-variant">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Box */}
                <div className="mt-6">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg p-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none resize-none"
                    rows={4}
                  />
                  <div className="flex justify-end mt-3">
                    <button 
                      disabled={!replyMessage.trim() || sending}
                      className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-on-surface-variant">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
