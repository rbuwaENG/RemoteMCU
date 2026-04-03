import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  notificationHistory: Notification[];
  addNotification: (type: Notification["type"], title: string, message?: string) => void;
  removeNotification: (id: string) => void;
  clearHistory: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<Notification[]>([]);

  const addNotification = useCallback((type: Notification["type"], title: string, message?: string) => {
    const id = Date.now().toString();
    const notification: Notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
    };
    
    // Add to both current notifications (for toast) and history (for dropdown)
    setNotifications(prev => [...prev, notification]);
    setNotificationHistory(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
    
    // Auto-remove from toast after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setNotificationHistory(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setNotificationHistory([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, notificationHistory, addNotification, removeNotification, clearHistory }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      notificationHistory: [],
      addNotification: () => {},
      removeNotification: () => {},
      clearHistory: () => {},
    };
  }
  return context;
};
