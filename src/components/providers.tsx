"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/lib/hooks/useNotifications";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  );
}
