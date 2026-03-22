"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import type { Theme } from "./ThemeContext";

const NAV_SLIDES = [
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    tab: "Dashboard",
    headline: "Your Pantry at a Glance",
    body: "The Dashboard gives you an instant overview — total items, what's expiring soon, low-stock alerts, and recently updated products all in one place.",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    ),
    tab: "Pantry",
    headline: "Manage Every Item",
    body: "Browse, search, and edit every item in your pantry. Track quantities, expiration dates, and restock thresholds — all in a clean, sortable table.",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        <circle cx="2" cy="6" r="1" fill="currentColor" stroke="none" />
        <circle cx="2" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="2" cy="14" r="1" fill="currentColor" stroke="none" />
        <circle cx="2" cy="18" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    tab: "Categories",
    headline: "Organise Your Way",
    body: "Create custom categories — Dairy, Spices, Canned Goods — and assign colours so your pantry stays structured and easy to navigate.",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    tab: "Shopping List",
    headline: "Never Forget to Restock",
    body: "Items that fall below their restock threshold automatically appear here. Check them off as you shop — organised alphabetically or by category.",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    ),
    tab: "Recipes",
    headline: "Cook What You Have",
    body: "Search thousands of recipes powered by Spoonacular using your pantry's ingredients. Exclude items you don't want to use and view full cooking instructions.",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    tab: "Alerts",
    headline: "Stay Ahead of Expiry",
    body: "Alerts flags expired items, products expiring within 7 days, and anything running low. Everything is grouped so you can act fast.",
  },
];

// Total slides: welcome (0) + units (1) + theme (2) + 6 nav slides (3–8) + done (9)
const TOTAL = 10;

interface Props {
  userName: string;
  onComplete: () => void;
}

export default function FirstTimeOnboarding({ userName, onComplete }: Props) {
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const [unitPref, setUnitPref] = useState<"Metric" | "Imperial">("Metric");
  const [saving, setSaving] = useState(false);
  const { theme, setTheme } = useTheme();

  // Animate between slides
  const goTo = (next: number, dir: "forward" | "back" = "forward") => {
    if (animating || next < 0 || next >= TOTAL) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setSlide(next);
      setAnimating(false);
    }, 260);
  };

  const next = () => goTo(slide + 1, "forward");
  const prev = () => goTo(slide - 1, "back");

  const handleSkip = () => finish();

  const finish = async () => {
    setSaving(true);
    try {
      // Save unit preference
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitPref }),
      });
    } catch { /* best-effort */ }
    setSaving(false);
    onComplete();
  };

  const firstName = userName.split(" ")[0] || userName;

  // Progress dots (only slides 3–8 have nav-slide dots)
  const isNavSlide = slide >= 3 && slide <= 8;
  const navSlideIdx = slide - 3; // 0–5

  const slideContent = () => {
    // ── Slide 0: Welcome ──────────────────────────────────────────────────────
    if (slide === 0) return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px", lineHeight: 1 }}>👋</div>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--foreground)", margin: "0 0 12px" }}>
          Hello, {firstName}!
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-body)", margin: "0 0 32px", lineHeight: 1.6, maxWidth: "360px", marginLeft: "auto", marginRight: "auto" }}>
          Welcome to <strong style={{ color: "var(--brand)" }}>PantryMonium</strong>. Let's get you set up in just a few steps so everything works perfectly for you.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
          <button onClick={next} style={primaryBtn}>
            Get Started →
          </button>
          <button onClick={handleSkip} style={ghostBtn}>
            Skip setup
          </button>
        </div>
      </div>
    );

    // ── Slide 1: Units ────────────────────────────────────────────────────────
    if (slide === 1) return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px", lineHeight: 1 }}>⚖️</div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--foreground)", margin: "0 0 8px" }}>
          Units of Measurement
        </h2>
        <p style={{ fontSize: "15px", color: "var(--text-body)", margin: "0 0 28px", lineHeight: 1.5 }}>
          Which system do you prefer for tracking quantities?
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "32px" }}>
          {(["Metric", "Imperial"] as const).map((u) => {
            const selected = unitPref === u;
            return (
              <button
                key={u}
                onClick={() => setUnitPref(u)}
                style={{
                  flex: 1, maxWidth: "180px", padding: "20px 16px", borderRadius: "14px",
                  border: `2px solid ${selected ? "var(--brand)" : "var(--border)"}`,
                  background: selected ? "var(--btn-edit-bg)" : "var(--surface-subtle)",
                  cursor: "pointer", transition: "all 0.15s", textAlign: "center",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{u === "Metric" ? "🌍" : "📏"}</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: selected ? "var(--brand)" : "var(--foreground)", marginBottom: "4px" }}>{u}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{u === "Metric" ? "kg, L, ml, g" : "lbs, oz, cups"}</div>
                {selected && (
                  <div style={{ marginTop: "10px", width: "10px", height: "10px", borderRadius: "50%", background: "var(--brand)", margin: "10px auto 0" }} />
                )}
              </button>
            );
          })}
        </div>
        <button onClick={next} style={primaryBtn}>Continue →</button>
      </div>
    );

    // ── Slide 2: Theme ────────────────────────────────────────────────────────
    if (slide === 2) return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px", lineHeight: 1 }}>🎨</div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--foreground)", margin: "0 0 8px" }}>
          Choose Your Theme
        </h2>
        <p style={{ fontSize: "15px", color: "var(--text-body)", margin: "0 0 28px", lineHeight: 1.5 }}>
          Pick how PantryMonium looks. You can always change this in Profile.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "32px" }}>
          {([
            { value: "light",    label: "Light",    icon: "☀️",  desc: "Bright & clean" },
            { value: "dark",     label: "Dark",     icon: "🌙",  desc: "Easy on the eyes" },
            { value: "midnight", label: "Midnight", icon: "🌑",  desc: "Pure black & grey" },
          ] as { value: Theme; label: string; icon: string; desc: string }[]).map(({ value, label, icon, desc }) => {
            const selected = theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                style={{
                  flex: 1, maxWidth: "140px", padding: "18px 10px", borderRadius: "14px",
                  border: `2px solid ${selected ? "var(--brand)" : "var(--border)"}`,
                  background: selected ? "var(--btn-edit-bg)" : "var(--surface-subtle)",
                  cursor: "pointer", transition: "all 0.15s", textAlign: "center",
                }}
              >
                <div style={{ fontSize: "26px", marginBottom: "8px" }}>{icon}</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: selected ? "var(--brand)" : "var(--foreground)", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{desc}</div>
                {selected && (
                  <div style={{ marginTop: "8px", width: "8px", height: "8px", borderRadius: "50%", background: "var(--brand)", margin: "8px auto 0" }} />
                )}
              </button>
            );
          })}
        </div>
        <button onClick={next} style={primaryBtn}>Continue →</button>
      </div>
    );

    // ── Slides 3–8: Nav tour ──────────────────────────────────────────────────
    if (slide >= 3 && slide <= 8) {
      const s = NAV_SLIDES[navSlideIdx];
      const isLast = slide === 8;
      return (
        <div style={{ textAlign: "center" }}>
          {/* Tab label pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 16px", borderRadius: "20px", marginBottom: "20px",
            background: "var(--btn-edit-bg)", border: "1px solid var(--btn-edit-border)",
          }}>
            <span style={{ color: "var(--brand)", opacity: 0.8 }}>{s.icon}</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.tab}</span>
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--foreground)", margin: "0 0 12px" }}>
            {s.headline}
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-body)", margin: "0 0 28px", lineHeight: 1.6, maxWidth: "380px", marginLeft: "auto", marginRight: "auto" }}>
            {s.body}
          </p>

          {/* Nav dots for tour slides */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "28px" }}>
            {NAV_SLIDES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === navSlideIdx ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: i === navSlideIdx ? "var(--brand)" : "var(--border)",
                  transition: "all 0.25s ease",
                }}
              />
            ))}
          </div>

          {isLast ? (
            <button onClick={finish} disabled={saving} style={primaryBtn}>
              {saving ? "Saving..." : "Done — Let's Go! 🎉"}
            </button>
          ) : (
            <button onClick={next} style={primaryBtn}>Next →</button>
          )}
        </div>
      );
    }

    return null;
  };

  const primaryBtn: React.CSSProperties = {
    padding: "13px 32px", borderRadius: "12px",
    background: "var(--brand)", color: "#fff",
    fontWeight: 700, fontSize: "15px", border: "none",
    cursor: "pointer", transition: "opacity 0.15s",
    minWidth: "180px",
  };

  const ghostBtn: React.CSSProperties = {
    padding: "10px 24px", borderRadius: "10px",
    background: "transparent", color: "var(--text-secondary)",
    fontWeight: 500, fontSize: "13px",
    border: "1px solid var(--border)",
    cursor: "pointer", transition: "all 0.15s",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "var(--card-bg)",
        borderRadius: "24px",
        border: "1px solid var(--card-border)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        width: "100%", maxWidth: "520px",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Progress bar */}
        <div style={{ height: "4px", background: "var(--border)", position: "relative" }}>
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%",
            background: "var(--brand)",
            width: `${((slide) / (TOTAL - 1)) * 100}%`,
            transition: "width 0.35s ease",
            borderRadius: "0 4px 4px 0",
          }} />
        </div>

        {/* Step counter */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 24px 0",
        }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
            {slide === 0 ? "Welcome" : `Step ${slide} of ${TOTAL - 1}`}
          </span>
          {slide > 0 && slide < TOTAL - 1 && (
            <button
              onClick={handleSkip}
              style={{ background: "none", border: "none", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 500 }}
            >
              Skip →
            </button>
          )}
        </div>

        {/* Slide content */}
        <div
          key={slide}
          style={{
            padding: "28px 40px 36px",
            animation: `${direction === "forward" ? "slideInRight" : "slideInLeft"} 0.28s ease`,
          }}
        >
          {slideContent()}
        </div>

        {/* Back button (not on slide 0 or final) */}
        {slide > 0 && slide < TOTAL - 1 && (
          <div style={{ padding: "0 40px 24px" }}>
            <button onClick={prev} style={{
              background: "none", border: "none", fontSize: "13px",
              color: "var(--text-secondary)", cursor: "pointer", fontWeight: 500, padding: 0,
            }}>
              ← Back
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
