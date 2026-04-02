"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  const sidebarLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/dashboard/devices", label: "My Devices", icon: "memory" },
    { href: "/docs", label: "Docs", icon: "description" },
    { href: "/dashboard/credits", label: "Credits", icon: "payments" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  ];

  const adminLinks = [
    { href: "/dashboard/admin", label: "Overview", icon: "dashboard" },
    { href: "/dashboard/admin/users", label: "Users", icon: "groups" },
    { href: "/dashboard/admin/devices", label: "Devices", icon: "devices" },
    { href: "/dashboard/admin/tickets", label: "Tickets", icon: "confirmation_number" },
    { href: "/dashboard/admin/plans", label: "Plans", icon: "sell" },
    { href: "/dashboard/admin/content", label: "Content", icon: "edit_note" },
    { href: "/dashboard/admin/docs", label: "Documentation", icon: "menu_book" },
    { href: "/dashboard/admin/settings", label: "Settings", icon: "settings" },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      minHeight: '100vh'
    }}>
      {/* Sidebar */}
      <aside className="w-[240px] h-screen fixed left-0 top-0 bg-[#252526] border-r border-white/5 z-50 overflow-hidden flex flex-col">
        {/* Top: Branding */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tighter text-[#F0F0F0] leading-none">Remote MCU</h1>
              <p className="text-[8px] uppercase tracking-[0.2em] text-primary font-bold mt-0.5">Synthetic Workshop</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-6 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${isActive
                    ? 'text-[#67d7dd] bg-white/5 rounded-sm border-l-[3px] border-[#67d7dd]'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                  }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#67d7dd]' : 'group-hover:text-primary'}`}>
                  {link.icon}
                </span>
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <p className="px-4 pb-2 text-[10px] font-mono text-white/30 uppercase tracking-wider">Admin</p>
              {adminLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${isActive
                        ? 'text-[#67d7dd] bg-white/5 rounded-sm border-l-[3px] border-[#67d7dd]'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                      }`}
                  >
                    <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#67d7dd]' : 'group-hover:text-primary'}`}>
                      {link.icon}
                    </span>
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Profile Anchor (Bottom) */}
        <div className="mt-auto pb-6 pt-4 border-t border-white/5 flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-lg bg-white overflow-hidden ring-1 ring-white/10 shrink-0">
            {user?.photoURL ? (
              <img alt="User Profile" className="w-full h-full object-cover" src={user.photoURL} />
            ) : (
              <div className="w-full h-full bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-container text-lg">person</span>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate text-on-surface">
              {user?.displayName || user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-[10px] text-neutral-500 truncate">
              {user?.email || "No email"}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="col-start-2">
        {/* TopAppBar */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#131313]/50 sticky top-0 z-[60] backdrop-blur-sm">
          <nav className="flex items-center gap-8">
            <Link href="/about" className="text-neutral-400 hover:text-[#F0F0F0] text-sm font-medium transition-colors">About Us</Link>
            <Link href="/support" className="text-neutral-400 hover:text-[#F0F0F0] text-sm font-medium transition-colors">Support</Link>
          </nav>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <span className="text-[#FFC107] text-xs">⚡</span>
              <span className="text-white text-xs font-bold tracking-tight">10 Credits</span>
            </div>
            <button className="p-2 text-neutral-400 hover:text-primary transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#67d7dd] rounded-full border border-[#131313]"></span>
            </button>
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 cursor-pointer">
              {user?.photoURL ? (
                <img alt="User" className="w-full h-full object-cover" src={user.photoURL} />
              ) : (
                <div className="w-full h-full bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container text-lg">person</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8 max-w-[1440px] mx-auto">
          {children}
        </main>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 right-8 z-[100]">
        <button className="w-14 h-14 bg-[#67d7dd] text-[#003739] rounded-sm shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-3xl">bolt</span>
        </button>
      </div>
    </div>
  );
}