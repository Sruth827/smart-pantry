"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Close sidebar when navigating on mobile
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
            background: "linear-gradient(180deg, #2D3748 0%, #3a4a60 100%)",
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
              {/* Hamburger icon */}
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
    </div>
  );
}
