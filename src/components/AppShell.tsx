"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";
import FirstTimeOnboarding from "./FirstTimeOnboarding";
import { useTheme } from "./ThemeContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState("");
  const { data: session, status } = useSession();
  const { theme } = useTheme();

  const topBarBg = theme === "midnight"
    ? "linear-gradient(180deg, #0a0a0a 0%, #141414 100%)"
    : "linear-gradient(180deg, #2D3748 0%, #3a4a60 100%)";

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Check if this user has been onboarded yet
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    const userId = session.user.id ?? session.user.email ?? "default";
    const key = `sp-onboarded-${userId}`;
    const alreadyOnboarded = localStorage.getItem(key);
    if (!alreadyOnboarded) {
      setUserName(session.user.name || session.user.email || "there");
      setShowOnboarding(true);
    }
  }, [status, session]);

  const handleOnboardingComplete = () => {
    const userId = session?.user?.id ?? session?.user?.email ?? "default";
    localStorage.setItem(`sp-onboarded-${userId}`, "true");
    setShowOnboarding(false);
  };

  const handleHelp = () => {
    setUserName(session?.user?.name || session?.user?.email || "there");
    setShowOnboarding(true);
  };

  const closeSidebar = () => { if (isMobile) setOpen(false); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)", transition: "background 0.2s ease" }}>

      {/* Mobile overlay backdrop */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      <Sidebar
        open={open}
        isMobile={isMobile}
        onToggle={() => setOpen((o) => !o)}
        onNavClick={closeSidebar}
        onHelp={handleHelp}
      />

      <main style={{
        marginLeft: isMobile ? 0 : "240px",
        flex: 1,
        minHeight: "100vh",
        transition: "margin-left 0.25s ease",
      }}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={{
            position: "sticky", top: 0, zIndex: 30,
            display: "flex", alignItems: "center", gap: "12px",
            padding: "12px 16px",
            background: topBarBg,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Open menu"
              style={{
                background: "rgba(255,255,255,0.12)", border: "none",
                borderRadius: "8px", padding: "8px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>PantryMonium</span>
          </div>
        )}

        {children}
      </main>

      {/* First-time onboarding overlay */}
      {showOnboarding && (
        <FirstTimeOnboarding
          userName={userName}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  );
}
