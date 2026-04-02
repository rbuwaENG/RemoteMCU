"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { createSupportTicket } from "@/lib/firestore/support";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Doc {
  id: string;
  title: string;
  content: string;
  description: string;
  status: "published" | "draft" | "archived";
  order: number;
}

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDocId, setActiveDocId] = useState<string>("");
  const { user } = useAuth();
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "", category: "technical" as const });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docsRef = collection(db, "documentation");
        const q = query(docsRef, where("status", "==", "published"), orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        const docsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Doc[];
        setDocs(docsData);
        if (docsData.length > 0) {
          setActiveDocId(docsData[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch docs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  const activeDoc = docs.find(d => d.id === activeDocId);

  const handleSubmitTicket = async () => {
    if (!user || !ticketForm.subject || !ticketForm.description) return;
    
    setSubmitting(true);
    try {
      await createSupportTicket({
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || user.email?.split("@")[0] || "User",
        subject: ticketForm.subject,
        description: ticketForm.description,
        category: ticketForm.category,
        priority: "medium",
        status: "open",
      });
      setShowTicketModal(false);
      setTicketForm({ subject: "", description: "", category: "technical" });
      alert("Ticket submitted successfully!");
    } catch (err) {
      console.error("Error submitting ticket:", err);
      alert("Failed to submit ticket. Please try again.");
    }
    setSubmitting(false);
  };

  const renderMarkdown = (content: string) => {
    return content
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-black text-on-surface mb-6">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-on-surface mb-4 mt-8">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-on-surface mb-3 mt-6">$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-bold text-on-surface mb-2 mt-4">$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-on-surface font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-surface-container-high px-2 py-1 rounded text-primary font-mono text-sm">$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-surface-container-high p-4 rounded-lg font-mono text-sm text-zinc-300 overflow-x-auto mb-4"><code>$2</code></pre>')
      .replace(/^- (.+)$/gm, '<li class="text-zinc-400 ml-4 mb-2">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="text-zinc-400 ml-4 mb-2">$1</li>')
      .replace(/\n\n/g, '</p><p class="text-zinc-400 mb-4 leading-relaxed">')
      .replace(/\n/g, '<br>');
  };

  return (
    <DashboardLayout>
      <div className="flex h-full">
        {/* Local Doc Navigation */}
        <nav className="w-[200px] h-full bg-[#252526] border-r border-[#3C3C3C] flex flex-col py-6 overflow-y-auto shrink-0">
          <div className="px-4 mb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#879394]">Documentation</span>
          </div>
          <div className="flex flex-col">
            {loading ? (
              <p className="px-4 py-2 text-[13px] text-zinc-500">Loading...</p>
            ) : docs.length === 0 ? (
              <p className="px-4 py-2 text-[13px] text-zinc-500">No documentation available</p>
            ) : (
              docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDocId(doc.id)}
                  className={`px-4 py-2 text-[13px] font-medium transition-colors text-left ${
                    activeDocId === doc.id
                      ? 'text-primary bg-[#1E1E1E] border-r-2 border-primary'
                      : 'text-[#bcc9c9] hover:text-[#f0f0f0] hover:bg-[#1E1E1E]'
                  }`}
                >
                  {doc.title}
                </button>
              ))
            )}
          </div>
        </nav>

        {/* Documentation Content Area */}
        <div className="flex-1 h-full bg-[#1E1E1E] overflow-y-auto">
          <div className="p-8 lg:p-12">
            <div className="max-w-4xl">
              {loading ? (
                <p className="text-zinc-500">Loading documentation...</p>
              ) : activeDoc ? (
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdown(activeDoc.content)
                  }}
                />
              ) : (
                <p className="text-zinc-500">Select a document from the navigation</p>
              )}
            </div>
          </div>
        </div>

        {/* Documentation Outline (Secondary Right Sidebar) */}
        <aside className="hidden xl:flex w-[240px] h-full bg-[#252526] flex-col py-8 px-6 border-l border-[#3C3C3C] shrink-0">
          <div className="mt-auto bg-[#1E1E1E] rounded p-4 border border-[#3C3C3C]">
            <p className="text-[10px] text-[#bcc9c9] mb-3 leading-relaxed">Need help from the engineering team?</p>
            <button 
              onClick={() => setShowTicketModal(true)}
              className="w-full py-2 bg-[#2d2d2d] hover:bg-[#3C3C3C] text-[#f0f0f0] text-[10px] font-bold uppercase tracking-widest rounded border border-[#3C3C3C] transition-all"
            >
              Open Support Ticket
            </button>
          </div>
        </aside>
      </div>

      {/* Support Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowTicketModal(false)}></div>
          <div className="relative bg-surface-container-low border border-outline-variant rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-on-surface">Open Support Ticket</h3>
              <button onClick={() => setShowTicketModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2">Subject</label>
                <input 
                  type="text" 
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  placeholder="Brief description of your issue"
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2">Category</label>
                <select 
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({...ticketForm, category: e.target.value as any})}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="technical">Technical</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2">Description</label>
                <textarea 
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none resize-none"
                />
              </div>
              <button 
                onClick={handleSubmitTicket}
                disabled={submitting || !ticketForm.subject || !ticketForm.description}
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
