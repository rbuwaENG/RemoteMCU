"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Doc {
  id: string;
  title: string;
  content: string;
  status: "published" | "draft" | "archived";
  description: string;
  order: number;
  lastEdited: any;
  author: string;
  authorName: string;
}

export default function DocumentationPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [saving, setSaving] = useState(false);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocDescription, setNewDocDescription] = useState("");
  const [seeding, setSeeding] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const defaultDocs = [
    {
      title: "Getting Started",
      description: "Learn how to set up and connect your first microcontroller",
      content: `# Getting Started\n\nWelcome to RemoteMCU! This guide will help you connect your first device.\n\n## Prerequisites\n\n- A microcontroller (ESP32, Arduino, STM32, etc.)\n- A computer to run the Host Agent\n- A RemoteMCU account\n\n## Quick Start\n\n1. **Create an Account** - Sign up at RemoteMCU\n2. **Download the Agent** - Get the Host Agent for your OS\n3. **Link Your Device** - Use your setup token to connect\n\n## Supported Hardware\n\n- ESP32 / ESP8266\n- Arduino Uno / Nano / Mega\n- STM32\n- Raspberry Pi Pico`,
      status: "published",
      order: 1,
    },
    {
      title: "Connecting a Device",
      description: "Step-by-step guide to connect your microcontroller",
      content: `# Connecting a Device\n\nThis guide walks you through connecting your microcontroller to RemoteMCU.\n\n## Method 1: USB Connection\n\n1. Connect your microcontroller to your computer via USB\n2. Download and extract the Host Agent\n3. Generate a setup token from your dashboard\n4. Run: python host_agent.py --token YOUR_TOKEN\n\n## Method 2: Network Connection\n\nFor network-enabled devices:\n\n1. Configure your device with WiFi credentials\n2. Enter the setup token in your firmware\n3. The device will automatically connect\n\n## Troubleshooting\n\n- **Device not detected**: Check USB cable and drivers\n- **Connection timeout**: Verify your network settings\n- **Token invalid**: Generate a new token from dashboard`,
      status: "published",
      order: 2,
    },
    {
      title: "Code Upload",
      description: "How to upload code to your remote devices",
      content: `# Code Upload\n\nLearn how to upload firmware to your connected devices.\n\n## Using the Code Editor\n\n1. Go to your device control panel\n2. Write or paste your code in the editor\n3. Click "Compile" to check for errors\n4. Click "Upload" to send to device\n\n## Supported Languages\n\n- C / C++ (primary)\n- Arduino sketches\n\n## OTA Updates\n\nOver-The-Air updates work when your device is connected via WiFi.`,
      status: "published",
      order: 3,
    },
    {
      title: "Serial Monitor",
      description: "View serial output from your devices",
      content: `# Serial Monitor\n\nThe Serial Monitor shows real-time output from your microcontroller.\n\n## Opening Serial Monitor\n\n1. Navigate to your device control panel\n2. Click on the "Terminal" or "Serial Monitor" tab\n3. Set your baud rate (default: 115200)\n\n## Features\n\n- Real-time output streaming\n- Send commands to device\n- Filter by log level\n- Export logs\n\n## Common Issues\n\n- **No output**: Check baud rate matches your code\n- **Garbage characters**: Try different baud rate`,
      status: "published",
      order: 4,
    },
    {
      title: "Camera Setup",
      description: "Set up camera streaming for ESP32-CAM",
      content: `# Camera Setup\n\nStream video from your ESP32-CAM or USB camera.\n\n## ESP32-CAM Setup\n\n1. Connect camera module to ESP32\n2. Upload camera firmware\n3. Configure camera settings in dashboard\n\n## USB Camera\n\n1. Connect USB camera to computer running Host Agent\n2. Agent will auto-detect camera\n3. View stream in device control panel\n\n## Troubleshooting\n\n- **No stream**: Check camera connections\n- **Laggy video**: Check network speed`,
      status: "published",
      order: 5,
    },
    {
      title: "Credits & Billing",
      description: "Understanding credits and billing",
      content: `# Credits & Billing\n\nRemoteMCU uses a credit-based system.\n\n## What are Credits?\n\nCredits are used for:\n- Remote debugging sessions\n- Code compilation\n- Data storage\n- Camera streaming\n\n## Free Plan\n\n- 10 credits/month\n- Up to 3 devices\n- Community support\n\n## Paid Plans\n\nUpgrade for more credits and features. Check the pricing page for details.\n\n## Viewing Usage\n\nTrack your credit usage in the Credits & Billing section of your dashboard.`,
      status: "published",
      order: 6,
    },
  ];

  const seedDefaultDocs = async () => {
    if (docs.length > 0) {
      const confirmAdd = confirm("Documents already exist. Add more?");
      if (!confirmAdd) return;
    }
    
    setSeeding(true);
    try {
      const docsRef = collection(db, "documentation");
      for (let i = 0; i < defaultDocs.length; i++) {
        const docData = defaultDocs[i];
        // Check if this doc title already exists
        const existing = docs.find(d => d.title === docData.title);
        if (existing) continue;
        
        await addDoc(docsRef, {
          ...docData,
          order: docs.length + i + 1,
          author: user?.uid || "admin",
          authorName: user?.displayName || user?.email?.split("@")[0] || "Admin",
          lastEdited: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }
      alert("Documentation added successfully!");
    } catch (error: unknown) {
      console.error("Failed to seed docs:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert("Failed to add documentation: " + errorMessage);
    }
    setSeeding(false);
  };

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    const docsRef = collection(db, "documentation");
    const unsubscribe = onSnapshot(docsRef, (snapshot) => {
      const docsData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) as Doc[];
      setDocs(docsData);
      if (docsData.length > 0 && !selectedDoc) {
        setSelectedDoc(docsData[0]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createNewDoc = async () => {
    if (!newDocTitle.trim()) return;
    
    try {
      const docsRef = collection(db, "documentation");
      await addDoc(docsRef, {
        title: newDocTitle,
        description: newDocDescription,
        content: `# ${newDocTitle}\n\nStart writing your documentation here...`,
        status: "draft",
        order: docs.length,
        author: user?.uid,
        authorName: user?.displayName || user?.email?.split("@")[0] || "Admin",
        lastEdited: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      setShowNewDocModal(false);
      setNewDocTitle("");
      setNewDocDescription("");
    } catch (error) {
      console.error("Failed to create doc:", error);
    }
  };

  const saveDraft = async () => {
    if (!selectedDoc) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, "documentation", selectedDoc.id);
      await updateDoc(docRef, {
        content: selectedDoc.content,
        lastEdited: serverTimestamp(),
      });
      alert("Draft saved!");
    } catch (error) {
      console.error("Failed to save:", error);
    }
    setSaving(false);
  };

  const publishDoc = async () => {
    if (!selectedDoc) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, "documentation", selectedDoc.id);
      await updateDoc(docRef, {
        status: "published",
        content: selectedDoc.content,
        lastEdited: serverTimestamp(),
      });
      alert("Document published!");
    } catch (error) {
      console.error("Failed to publish:", error);
    }
    setSaving(false);
  };

  const unpublishDoc = async () => {
    if (!selectedDoc) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, "documentation", selectedDoc.id);
      await updateDoc(docRef, {
        status: "draft",
        lastEdited: serverTimestamp(),
      });
      alert("Document unpublished!");
    } catch (error) {
      console.error("Failed to unpublish:", error);
    }
    setSaving(false);
  };

  const deleteDocument = async () => {
    if (!selectedDoc || !confirm("Are you sure you want to delete this document?")) return;
    
    setSaving(true);
    try {
      await deleteDoc(doc(db, "documentation", selectedDoc.id));
      setSelectedDoc(null);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
    setSaving(false);
  };

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Documentation Header */}
      <div className="flex justify-between items-end mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-mono text-[11px] tracking-[0.2em] uppercase">
            Project Knowledge Base
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-background">
            Documentation Management
          </h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={seedDefaultDocs}
            disabled={seeding}
            className="px-4 py-2.5 border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">library_add</span>
            {seeding ? "Adding..." : "Add Default Docs"}
          </button>
          <button 
            onClick={() => setShowNewDocModal(true)}
            className="bg-gradient-to-br from-primary to-primary-container px-6 py-2.5 rounded-lg text-on-primary font-bold text-sm shadow-[0_4px_20px_rgba(103,215,221,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create New Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Document Explorer */}
        <section className="col-span-4 space-y-4">
          <div className="bg-surface-container-low rounded-xl p-6 h-[calc(100vh-280px)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">folder_open</span>
                DOCUMENT EXPLORER
              </h3>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1">
              {docs.length === 0 ? (
                <p className="text-on-surface-variant text-sm">No documents yet. Create one!</p>
              ) : (
                docs.map((docItem) => (
                  <div
                    key={docItem.id}
                    onClick={() => setSelectedDoc(docItem)}
                    className={`p-4 rounded-lg group cursor-pointer transition-all ${
                      selectedDoc?.id === docItem.id
                        ? "bg-surface-container-high border-l-2 border-primary"
                        : "hover:bg-surface-container-high/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4
                        className={`text-sm font-bold ${
                          selectedDoc?.id === docItem.id ? "text-on-surface" : "text-zinc-400 group-hover:text-on-surface"
                        } transition-colors`}
                      >
                        {docItem.title}
                      </h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                          docItem.status === "published"
                            ? "bg-primary/10 text-primary"
                            : docItem.status === "draft"
                            ? "bg-zinc-800 text-zinc-400"
                            : "bg-error/10 text-error"
                        }`}
                      >
                        {docItem.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1 mb-2">{docItem.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-mono">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">person</span> {docItem.authorName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Document Editor */}
        <section className="col-span-8 space-y-6">
          {selectedDoc ? (
            <div className="bg-surface-container-low rounded-xl flex flex-col h-[calc(100vh-280px)] overflow-hidden">
              {/* Editor Toolbar */}
              <div className="bg-surface-container p-4 border-b border-zinc-800/40 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold text-on-surface tracking-tight leading-none">
                      {selectedDoc.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono py-0.5 px-2 border-l-2 ${
                        selectedDoc.status === "published" 
                          ? "bg-primary/20 text-primary border-primary"
                          : "bg-zinc-800 text-zinc-400 border-zinc-600"
                      }`}>
                        {selectedDoc.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="h-8 w-[1px] bg-zinc-800 mx-2"></div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setActiveTab("editor")}
                      className={`px-3 py-1 text-xs rounded ${activeTab === "editor" ? "bg-primary text-on-primary" : "text-zinc-400 hover:text-on-surface"}`}
                    >
                      Editor
                    </button>
                    <button 
                      onClick={() => setActiveTab("preview")}
                      className={`px-3 py-1 text-xs rounded ${activeTab === "preview" ? "bg-primary text-on-primary" : "text-zinc-400 hover:text-on-surface"}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={deleteDocument}
                    className="px-4 py-2 text-error hover:bg-error/10 text-xs font-semibold transition-all rounded"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={saveDraft}
                    disabled={saving}
                    className="px-4 py-2 text-zinc-400 hover:text-on-surface text-xs font-semibold transition-all"
                  >
                    {saving ? "Saving..." : "Save Draft"}
                  </button>
                  {selectedDoc.status === "published" ? (
                    <button 
                      onClick={unpublishDoc}
                      disabled={saving}
                      className="bg-warning/10 border border-warning/20 px-5 py-2 rounded text-warning font-bold text-xs hover:bg-warning/20 transition-all"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button 
                      onClick={publishDoc}
                      disabled={saving}
                      className="bg-primary/10 border border-primary/20 px-5 py-2 rounded text-primary font-bold text-xs hover:bg-primary/20 transition-all"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>

              {/* Editor Area */}
              <div className="flex-1 flex overflow-hidden">
                {activeTab === "editor" ? (
                  <div className="w-full border-r border-zinc-800/40 p-6">
                    <textarea
                      ref={editorRef}
                      value={selectedDoc.content}
                      onChange={(e) => setSelectedDoc({ ...selectedDoc, content: e.target.value })}
                      className="w-full h-full bg-transparent font-mono text-sm text-zinc-300 resize-none outline-none"
                      placeholder="Write your documentation in Markdown..."
                    />
                  </div>
                ) : (
                  <div className="w-full bg-surface-container-lowest/50 p-8 overflow-y-auto">
                    <div 
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: selectedDoc.content
                          .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-black text-on-surface mb-6">$1</h1>')
                          .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-on-surface mb-4">$1</h2>')
                          .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-on-surface mb-3">$1</h3>')
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>')
                          .replace(/`([^`]+)`/g, '<code class="bg-surface-container-high px-1 rounded text-primary">$1</code>')
                          .replace(/\n\n/g, '</p><p class="text-zinc-400 mb-4">')
                          .replace(/\n/g, '<br>')
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-xl p-12 flex items-center justify-center h-[calc(100vh-280px)]">
              <p className="text-zinc-500">Select a document to edit or create a new one</p>
            </div>
          )}
        </section>
      </div>

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowNewDocModal(false)}></div>
          <div className="relative bg-surface-container-low border border-outline-variant rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-on-surface">Create New Document</h3>
              <button onClick={() => setShowNewDocModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2">Title</label>
                <input 
                  type="text" 
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Document title"
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2">Description</label>
                <textarea 
                  value={newDocDescription}
                  onChange={(e) => setNewDocDescription(e.target.value)}
                  placeholder="Brief description"
                  rows={3}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none resize-none"
                />
              </div>
              <button 
                onClick={createNewDoc}
                disabled={!newDocTitle.trim()}
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
