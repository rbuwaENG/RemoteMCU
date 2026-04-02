import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const STORAGE_BASE_URL = "gs://remotemcu-bfb84.firebasestorage.app/host-agent";

export interface HostAgentDownload {
  id: string;
  name: string;
  os: "windows" | "macos" | "linux";
  fileName: string;
  size: string;
  url: string;
}

export const getHostAgentDownloads = async (): Promise<HostAgentDownload[]> => {
  const downloads: HostAgentDownload[] = [
    {
      id: "windows",
      name: "Windows",
      os: "windows",
      fileName: "remote-mcu-host-agent-win.zip",
      size: "~26KB",
      url: "",
    },
    {
      id: "macos",
      name: "macOS", 
      os: "macos",
      fileName: "remote-mcu-host-agent-mac.zip",
      size: "~26KB",
      url: "",
    },
    {
      id: "linux",
      name: "Linux",
      os: "linux",
      fileName: "remote-mcu-host-agent-linux.tar.gz",
      size: "~22KB",
      url: "",
    },
  ];
  
  // Try to get URLs from Firebase Storage
  for (const download of downloads) {
    try {
      const storageRef = ref(storage, `host-agent/${download.fileName}`);
      const url = await getDownloadURL(storageRef);
      download.url = url;
    } catch (error) {
      console.log(`Could not get URL for ${download.fileName}, using direct URL`);
      // Fallback to direct URL
      download.url = `https://firebasestorage.googleapis.com/v0/b/remotemcu-bfb84.appspot.com/o/host-agent%2F${download.fileName}?alt=media`;
    }
  }
  
  return downloads;
};
