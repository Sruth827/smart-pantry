"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./ThemeContext";
import Image from "next/image";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/pantry",
    label: "Pantry",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    ),
  },
  {
    href: "/categories",
    label: "Categories",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        <circle cx="2" cy="6" r="1" fill="currentColor" stroke="none" />
        <circle cx="2" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="2" cy="14" r="1" fill="currentColor" stroke="none" />
        <circle cx="2" cy="18" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/shopping",
    label: "Shopping List",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    href: "/recipes",
    label: "Recipes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    ),
  },
  {
    href: "/alerts",
    label: "Alerts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

interface SidebarProps {
  open: boolean;
  isMobile: boolean;
  onToggle: () => void;
  onNavClick: () => void;
}

export default function Sidebar({ open, isMobile, onToggle, onNavClick }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme } = useTheme();

  const sidebarBg = theme === "midnight"
    ? "linear-gradient(180deg, #0a0a0a 0%, #141414 60%, #1a1a1a 100%)"
    : "linear-gradient(180deg, #2D3748 0%, #3a4a60 60%, #4A6FA5 100%)";

  // On desktop the sidebar is always visible; on mobile it slides in/out
  const isVisible = !isMobile || open;

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: sidebarBg,
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
        transform: isVisible ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
      }}
    >
      {/* Logo + close button row */}
      <div style={{
        padding: "16px 12px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
      }}>
        <Image
          src="/Logo_Side.png"
          alt="PantryMonium"
          width={180}
          height={54}
          style={{ objectFit: "contain", objectPosition: "left center", flex: 1, height: "auto" }}
          priority
        />
        {/* Close button — only shown on mobile */}
        {isMobile && (
          <button
            onClick={onToggle}
            aria-label="Close menu"
            style={{
              background: "rgba(255,255,255,0.1)", border: "none",
              borderRadius: "8px", padding: "6px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.8)", flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "10px",
                color: isActive ? "#2D3748" : "rgba(255,255,255,0.8)",
                background: isActive ? "#fff" : "transparent",
                fontWeight: isActive ? 600 : 400,
                fontSize: "14px",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
                }
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.85, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{
          padding: "10px 14px", borderRadius: "10px",
          background: "rgba(255,255,255,0.08)", marginBottom: "8px",
        }}>
          <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session?.user?.name || "User"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session?.user?.email}
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            width: "100%", padding: "9px 14px", borderRadius: "10px",
            background: "rgba(239,68,68,0.15)", color: "#fca5a5",
            border: "1px solid rgba(239,68,68,0.25)", fontSize: "13px",
            fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.3)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)"; }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
