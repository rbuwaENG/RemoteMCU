"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    flashComplete: true,
    lowCredits: true,
  });

  return (
    <div>
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h1 style={{ fontSize: "var(--headline-md)", marginBottom: "var(--space-2)" }}>Settings</h1>
        <p style={{ color: "var(--on-surface-variant)" }}>
          Manage your account preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--title-lg)", marginBottom: "var(--space-6)" }}>Profile</h2>
        
        <div className="flex gap-6" style={{ marginBottom: "var(--space-6)" }}>
          <div style={{ 
            width: "80px", 
            height: "80px", 
            borderRadius: "50%", 
            background: "var(--primary-container)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "var(--headline-md)",
            fontWeight: 700,
            color: "var(--on-primary-container)",
          }}>
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, marginBottom: "var(--space-2)" }}>{user?.displayName || "User"}</p>
            <p style={{ color: "var(--on-surface-variant)", marginBottom: "var(--space-2)" }}>{user?.email}</p>
            <p style={{ fontSize: "var(--body-sm)", color: "var(--outline)" }}>
              Signed in with {user?.providerData[0]?.providerId === "google.com" ? "Google" : "Email"}
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--title-lg)", marginBottom: "var(--space-6)" }}>Notifications</h2>
        
        <div className="flex flex-between" style={{ marginBottom: "var(--space-4)", padding: "var(--space-3) 0", borderBottom: "1px solid var(--outline-variant)" }}>
          <div>
            <p style={{ fontWeight: 500 }}>Email Notifications</p>
            <p style={{ fontSize: "var(--body-sm)", color: "var(--on-surface-variant)" }}>Receive updates via email</p>
          </div>
          <button 
            className={`btn btn-sm ${notifications.email ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
          >
            {notifications.email ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div className="flex flex-between" style={{ marginBottom: "var(--space-4)", padding: "var(--space-3) 0", borderBottom: "1px solid var(--outline-variant)" }}>
          <div>
            <p style={{ fontWeight: 500 }}>Flash Complete</p>
            <p style={{ fontSize: "var(--body-sm)", color: "var(--on-surface-variant)" }}>Notify when flashing is complete</p>
          </div>
          <button 
            className={`btn btn-sm ${notifications.flashComplete ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setNotifications({ ...notifications, flashComplete: !notifications.flashComplete })}
          >
            {notifications.flashComplete ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div className="flex flex-between" style={{ padding: "var(--space-3) 0" }}>
          <div>
            <p style={{ fontWeight: 500 }}>Low Credits Warning</p>
            <p style={{ fontSize: "var(--body-sm)", color: "var(--on-surface-variant)" }}>Alert when credits are low</p>
          </div>
          <button 
            className={`btn btn-sm ${notifications.lowCredits ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setNotifications({ ...notifications, lowCredits: !notifications.lowCredits })}
          >
            {notifications.lowCredits ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: "1px solid var(--error)" }}>
        <h2 style={{ fontSize: "var(--title-lg)", marginBottom: "var(--space-4)", color: "var(--error)" }}>Danger Zone</h2>
        <p style={{ color: "var(--on-surface-variant)", marginBottom: "var(--space-4)" }}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button className="btn btn-danger">Delete Account</button>
      </div>
    </div>
  );
}
