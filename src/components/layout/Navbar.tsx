"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSiteContent } from "@/lib/hooks/useSiteContent";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { siteName } = useSiteContent();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <nav className="h-[56px] w-full sticky top-0 z-50 bg-[#1b1b1c] border-b border-[#2a2a2a]/20 shadow-lg shadow-black/20 flex justify-between items-center px-6">
      <Link href="/" className="text-[18px] font-bold text-[#F0F0F0] flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" data-icon="memory">memory</span>
        <span>{siteName || "Remote MCU"}</span>
      </Link>
      <div className="hidden md:flex gap-8 items-center font-['Inter'] text-[14px] font-medium tracking-tight">
        <a href="#about" className="text-[#bcc9c9] hover:text-[#67d7dd] transition-all">About Us</a>
        <a href="#pricing" className="text-[#bcc9c9] hover:text-[#67d7dd] transition-all">Pricing</a>
        <a href="#support" className="text-[#bcc9c9] hover:text-[#67d7dd] transition-all">Support</a>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="text-[#bcc9c9] text-[14px] font-medium hover:text-[#67d7dd] transition-all"
            >
              Logout
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="text-sm font-bold text-on-primary-container">
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4 mr-2">
            <Link href="/auth" className="text-[#00979D] text-[14px] font-medium hover:brightness-110 transition-all">
              Login
            </Link>
            <Link href="/auth" className="bg-[#00979D] text-white px-4 py-1.5 rounded-lg text-[14px] font-medium hover:brightness-110 active:scale-95 transition-all">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
