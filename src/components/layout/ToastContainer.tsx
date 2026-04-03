"use client";

import { useNotifications } from "@/lib/hooks/useNotifications";

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  const getStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/20 border-green-500 text-green-400";
      case "error":
        return "bg-red-500/20 border-red-500 text-red-400";
      case "warning":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
      default:
        return "bg-blue-500/20 border-blue-500 text-blue-400";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return "check_circle";
      case "error":
        return "error";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start gap-3 p-4 rounded-lg border ${getStyles(notification.type)} shadow-lg backdrop-blur-sm min-w-[300px] max-w-[400px]`}
        >
          <span className="material-symbols-outlined">{getIcon(notification.type)}</span>
          <div className="flex-1">
            <p className="font-bold text-sm">{notification.title}</p>
            {notification.message && (
              <p className="text-xs opacity-80 mt-1">{notification.message}</p>
            )}
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="opacity-60 hover:opacity-100"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
