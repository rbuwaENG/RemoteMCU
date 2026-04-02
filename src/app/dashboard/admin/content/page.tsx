"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useSiteContent } from "@/lib/hooks/useSiteContent";
import { updateSiteContent } from "@/lib/firestore/content";
import { createAdminLog } from "@/lib/firestore/adminLogs";

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface Architect {
  name: string;
  title: string;
  bio: string;
  image: string;
}

export default function ContentManagementPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { content, loading: contentLoading } = useSiteContent();
  
  const [heroData, setHeroData] = useState({
    title: "Architecting the Future of Remote Hardware",
    subtext: "The unified platform for managing ESP32, STM32, and Arduino fleets from a single terminal interface.",
  });
  const [socialLinks, setSocialLinks] = useState({
    discord: "",
    buymeacoffee: "",
  });
  const [aboutData, setAboutData] = useState({
    story: "",
    mission: "",
  });
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [features, setFeatures] = useState<Feature[]>([
    { title: "Remote Code Upload", description: "Secure Over-The-Air (OTA) flashing. Push your compiled binaries directly to your devices through our encrypted tunnel.", icon: "cloud_upload" },
    { title: "Live Serial Monitor", description: "Real-time bidirectional communication. Debug variables and send commands through a web-based serial terminal with zero latency.", icon: "terminal" },
    { title: "Camera Debug Feed", description: "Visualize your hardware environment. Integrated support for ESP32-CAM and external USB modules to see what your device sees.", icon: "videocam" },
  ]);
  const [saving, setSaving] = useState(false);
  const [showAddArchitect, setShowAddArchitect] = useState(false);
  const [newArchitect, setNewArchitect] = useState({ name: "", title: "", bio: "", image: "" });
  const [showAddFeature, setShowAddFeature] = useState(false);
  const [newFeature, setNewFeature] = useState({ title: "", description: "", icon: "star" });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (content) {
      setHeroData({
        title: content.hero?.title || heroData.title,
        subtext: content.hero?.subtext || heroData.subtext,
      });
      setSocialLinks({
        discord: content.socialLinks?.discord || "",
        buymeacoffee: content.socialLinks?.buymeacoffee || "",
      });
      setAboutData({
        story: content.about?.story || "",
        mission: content.about?.mission || "",
      });
      setArchitects(content.architects || []);
      setFeatures(content.features || [
        { title: "Remote Code Upload", description: "Secure Over-The-Air (OTA) flashing. Push your compiled binaries directly to your devices through our encrypted tunnel.", icon: "cloud_upload" },
        { title: "Live Serial Monitor", description: "Real-time bidirectional communication. Debug variables and send commands through a web-based serial terminal with zero latency.", icon: "terminal" },
        { title: "Camera Debug Feed", description: "Visualize your hardware environment. Integrated support for ESP32-CAM and external USB modules to see what your device sees.", icon: "videocam" },
      ]);
    }
  }, [content]);

  const handlePublish = async () => {
    setSaving(true);
    try {
      await updateSiteContent({
        hero: heroData,
        features: features,
        about: aboutData,
        socialLinks: socialLinks,
        architects: architects,
      }, user?.uid || "");
      
      await createAdminLog(
        user?.uid || "",
        user?.displayName || user?.email || "Admin",
        "UPDATE_CONTENT",
        "siteContent",
        "main",
        "Updated site content and architects",
        "committed"
      );
      
      alert("Content published successfully!");
    } catch (error) {
      console.error("Failed to publish:", error);
      alert("Failed to publish content");
    } finally {
      setSaving(false);
    }
  };

  const handleAddArchitect = async () => {
    if (!newArchitect.name.trim()) return;
    
    const updatedArchitects = [...architects, newArchitect];
    setArchitects(updatedArchitects);
    
    try {
      await updateSiteContent({
        hero: heroData,
        features: features,
        about: aboutData,
        socialLinks: socialLinks,
        architects: updatedArchitects,
      }, user?.uid || "");
      
      setShowAddArchitect(false);
      setNewArchitect({ name: "", title: "", bio: "", image: "" });
    } catch (error) {
      console.error("Failed to add architect:", error);
    }
  };

  const handleRemoveArchitect = async (index: number) => {
    const updatedArchitects = architects.filter((_, i) => i !== index);
    setArchitects(updatedArchitects);
    
    try {
      await updateSiteContent({
        hero: heroData,
        features: features,
        about: aboutData,
        socialLinks: socialLinks,
        architects: updatedArchitects,
      }, user?.uid || "");
    } catch (error) {
      console.error("Failed to remove architect:", error);
    }
  };

  const handleAddFeature = async () => {
    if (!newFeature.title.trim()) return;
    
    const updatedFeatures = [...features, newFeature];
    setFeatures(updatedFeatures);
    
    try {
      await updateSiteContent({
        hero: heroData,
        features: updatedFeatures,
        about: aboutData,
        socialLinks: socialLinks,
        architects: architects,
      }, user?.uid || "");
      
      setShowAddFeature(false);
      setNewFeature({ title: "", description: "", icon: "star" });
    } catch (error) {
      console.error("Failed to add feature:", error);
    }
  };

  const handleRemoveFeature = async (index: number) => {
    const updatedFeatures = features.filter((_, i) => i !== index);
    setFeatures(updatedFeatures);
    
    try {
      await updateSiteContent({
        hero: heroData,
        features: updatedFeatures,
        about: aboutData,
        socialLinks: socialLinks,
        architects: architects,
      }, user?.uid || "");
    } catch (error) {
      console.error("Failed to remove feature:", error);
    }
  };

  if (authLoading || contentLoading || !user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-on-surface mb-2">Content Management</h2>
          <p className="text-on-surface-variant font-mono text-sm">
            Deployment Stage: <span className="text-primary">Production-Active</span>
          </p>
        </div>
        <button 
          onClick={handlePublish}
          disabled={saving}
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-lg font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(103,215,221,0.2)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined">publish</span>
          {saving ? "Publishing..." : "Publish Changes"}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-8 bg-surface-container-low rounded-xl p-8 border border-outline-variant/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-primary">view_quilt</span>
            <h3 className="text-xl font-bold tracking-tight">Landing Page Hero Editor</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Hero Main Title</label>
              <input
                className="w-full bg-surface-container-highest border-0 border-b border-outline-variant focus:border-primary focus:ring-0 text-zinc-100 py-3 transition-all placeholder:text-zinc-600 font-bold text-2xl"
                type="text"
                value={heroData.title}
                onChange={(e) => setHeroData({ ...heroData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Subtext Paragraph</label>
              <textarea
                className="w-full bg-surface-container-highest border-0 border-b border-outline-variant focus:border-primary focus:ring-0 text-on-surface-variant py-3 transition-all resize-none leading-relaxed"
                rows={3}
                value={heroData.subtext}
                onChange={(e) => setHeroData({ ...heroData, subtext: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="col-span-4 bg-surface-container-low rounded-xl p-8 border border-outline-variant/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-tertiary/40"></div>
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-tertiary">share</span>
            <h3 className="text-xl font-bold tracking-tight">Social & Links</h3>
          </div>
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-zinc-500">link</span>
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Discord Invite</label>
              </div>
              <input
                className="w-full bg-surface-container-highest border-0 border-b border-outline-variant focus:border-tertiary focus:ring-0 text-zinc-100 py-2 transition-all font-mono text-sm"
                type="url"
                placeholder="https://discord.gg/..."
                value={socialLinks.discord}
                onChange={(e) => setSocialLinks({ ...socialLinks, discord: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-zinc-500">coffee</span>
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Buy Me a Coffee URL</label>
              </div>
              <input
                className="w-full bg-surface-container-highest border-0 border-b border-outline-variant focus:border-tertiary focus:ring-0 text-zinc-100 py-2 transition-all font-mono text-sm"
                type="url"
                placeholder="https://buymeacoffee.com/..."
                value={socialLinks.buymeacoffee}
                onChange={(e) => setSocialLinks({ ...socialLinks, buymeacoffee: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="col-span-12 bg-surface-container-low rounded-xl p-8 border border-outline-variant/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-secondary">apps</span>
            <h3 className="text-xl font-bold tracking-tight">Feature Cards (Landing Page)</h3>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-surface-container-high rounded-lg p-5 border border-outline-variant/10 relative group">
                <button 
                  onClick={() => handleRemoveFeature(idx)}
                  className="absolute top-3 right-3 text-zinc-500 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-secondary">{feature.icon}</span>
                </div>
                <h4 className="text-sm font-bold text-zinc-100 mb-2">{feature.title}</h4>
                <p className="text-[11px] text-zinc-500 leading-tight">{feature.description}</p>
              </div>
            ))}
            <button 
              onClick={() => setShowAddFeature(true)}
              className="p-5 rounded-lg border-2 border-dashed border-outline-variant/30 text-zinc-500 hover:text-secondary hover:border-secondary/40 hover:bg-secondary/5 transition-all flex flex-col items-center justify-center gap-2 min-h-[160px]"
            >
              <span className="material-symbols-outlined">add</span>
              <span className="font-mono text-[10px] uppercase">Add Feature</span>
            </button>
          </div>
        </section>

        <section className="col-span-12 bg-surface-container-low rounded-xl p-8 border border-outline-variant/5 shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">corporate_fare</span>
              <h3 className="text-xl font-bold tracking-tight">'About Us' Deep Editor</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-10">
            <div className="col-span-2 space-y-8">
              <div className="space-y-3">
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 flex justify-between">
                  <span>Company Story & Evolution</span>
                  <span>{aboutData.story.length} Characters</span>
                </label>
                <textarea
                  className="w-full bg-surface-container-highest border-0 border-b border-outline-variant focus:border-primary focus:ring-0 text-on-surface-variant py-4 transition-all resize-none leading-relaxed"
                  rows={8}
                  placeholder="Tell your company's story..."
                  value={aboutData.story}
                  onChange={(e) => setAboutData({ ...aboutData, story: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Mission Statement (Short Highlight)
                </label>
                <input
                  className="w-full bg-surface-container-highest border-0 border-b border-outline-variant focus:border-primary focus:ring-0 text-zinc-100 py-3 transition-all font-semibold italic text-lg"
                  type="text"
                  placeholder="Our mission is..."
                  value={aboutData.mission}
                  onChange={(e) => setAboutData({ ...aboutData, mission: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-6">
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-4">
                Team Members / Architects ({architects.length})
              </label>
              
              {architects.length > 0 ? (
                <div className="space-y-3">
                  {architects.map((architect, idx) => (
                    <div key={idx} className="bg-surface-container-high rounded-lg p-4 border border-outline-variant/10 flex gap-4 items-start group hover:border-primary/30 transition-all">
                      {architect.image ? (
                        <img src={architect.image} alt={architect.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary">person</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-zinc-100">{architect.name}</h4>
                        <p className="text-[11px] text-primary font-mono uppercase tracking-tighter mb-1">
                          {architect.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 leading-tight truncate">
                          {architect.bio}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRemoveArchitect(idx)}
                        className="text-zinc-500 hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No team members added yet</p>
              )}
              
              <button 
                onClick={() => setShowAddArchitect(true)}
                className="w-full py-3 rounded-lg border-2 border-dashed border-outline-variant/30 text-zinc-500 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-sm">add</span> Add Team Member
              </button>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-12 py-6 border-t border-outline-variant/10 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span className="text-[10px] font-mono text-zinc-500">Auto-save: Enabled</span>
          </div>
        </div>
      </footer>

      {showAddArchitect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#2D2D2D] w-full max-w-md rounded-lg border border-[#3C3C3C] shadow-2xl p-6">
            <h3 className="text-lg font-bold text-on-surface mb-4">Add Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Name</label>
                <input
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                  placeholder="e.g. John Doe"
                  value={newArchitect.name}
                  onChange={(e) => setNewArchitect({ ...newArchitect, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Title / Role</label>
                <input
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                  placeholder="e.g. Lead Engineer"
                  value={newArchitect.title}
                  onChange={(e) => setNewArchitect({ ...newArchitect, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Bio</label>
                <textarea
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1 resize-none"
                  rows={3}
                  placeholder="Short bio..."
                  value={newArchitect.bio}
                  onChange={(e) => setNewArchitect({ ...newArchitect, bio: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Image URL</label>
                <input
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-primary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                  placeholder="https://example.com/photo.jpg"
                  value={newArchitect.image}
                  onChange={(e) => setNewArchitect({ ...newArchitect, image: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowAddArchitect(false); setNewArchitect({ name: "", title: "", bio: "", image: "" }); }}
                  className="flex-1 px-4 py-2 border border-white/10 text-white/60 rounded hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddArchitect}
                  className="flex-1 px-4 py-2 bg-primary text-on-primary font-bold rounded hover:brightness-110 transition-all"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddFeature && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#2D2D2D] w-full max-w-md rounded-lg border border-[#3C3C3C] shadow-2xl p-6">
            <h3 className="text-lg font-bold text-on-surface mb-4">Add Feature Card</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Title</label>
                <input
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-secondary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                  placeholder="e.g. Remote Code Upload"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Description</label>
                <textarea
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-secondary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1 resize-none"
                  rows={3}
                  placeholder="Feature description..."
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Icon Name (Material Symbols)</label>
                <input
                  className="w-full bg-surface-container-high border-none border-b border-transparent focus:border-secondary focus:ring-0 text-on-surface rounded-sm px-4 py-2 mt-1"
                  placeholder="e.g. cloud_upload, terminal, videocam"
                  value={newFeature.icon}
                  onChange={(e) => setNewFeature({ ...newFeature, icon: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowAddFeature(false); setNewFeature({ title: "", description: "", icon: "star" }); }}
                  className="flex-1 px-4 py-2 border border-white/10 text-white/60 rounded hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFeature}
                  className="flex-1 px-4 py-2 bg-secondary text-on-secondary font-bold rounded hover:brightness-110 transition-all"
                >
                  Add Feature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}