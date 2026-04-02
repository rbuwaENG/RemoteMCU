import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SiteContent } from "@/lib/firestore/content";

const defaultContent: SiteContent = {
  hero: {
    title: "Remote MCU - Remote Microcontroller Development",
    subtext: "Connect, program, and debug your microcontrollers from anywhere in the world."
  },
  features: [
    { title: "Remote Code Upload", description: "Secure Over-The-Air (OTA) flashing. Push your compiled binaries directly to your devices through our encrypted tunnel.", icon: "cloud_upload" },
    { title: "Live Serial Monitor", description: "Real-time bidirectional communication. Debug variables and send commands through a web-based serial terminal with zero latency.", icon: "terminal" },
    { title: "Camera Debug Feed", description: "Visualize your hardware environment. Integrated support for ESP32-CAM and external USB modules to see what your device sees.", icon: "videocam" },
  ],
  about: {
    story: "RemoteMCU was born from a simple problem: developers needed to access their hardware labs remotely.",
    mission: "To democratize hardware development by providing seamless remote access to microcontroller devices."
  },
  socialLinks: {
    discord: "https://discord.gg/remotemcu",
    buymeacoffee: "https://buymeacoffee.com/remotemcu"
  },
  architects: [
    { name: "Alex Rivera", title: "Chief Systems Architect", bio: "Veteran firmware engineer with a passion for secure OTA protocols and edge computing efficiency.", image: "" },
    { name: "Sarah Chen", title: "Protocol Lead", bio: "Specialist in low-latency WebRTC data channels and real-time visualization for hardware clusters.", image: "" },
    { name: "Marcus Thorne", title: "Infrastructure Dev", bio: "The mastermind behind our global tunnel network, ensuring 99.9% uptime for your remote devices.", image: "" },
  ],
  updatedAt: null,
  updatedBy: ""
};

export const useSiteContent = () => {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const contentRef = doc(db, "siteContent", "main");
    
    const unsubscribe = onSnapshot(contentRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteContent;
          setContent({
            ...defaultContent,
            ...data,
            architects: (data.architects || defaultContent.architects).map(a => ({ ...a, image: a.image || "" })),
            features: data.features || defaultContent.features,
            hero: data.hero || defaultContent.hero,
            about: data.about || defaultContent.about,
            socialLinks: data.socialLinks || defaultContent.socialLinks,
          });
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    content,
    hero: content.hero,
    features: content.features,
    about: content.about,
    socialLinks: content.socialLinks,
    architects: content.architects,
    loading,
    error
  };
};