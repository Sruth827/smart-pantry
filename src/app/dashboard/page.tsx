"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import FirstTimeOnboarding from "@/components/FirstTimeOnboarding";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StatCard({
  label, value, sub, iconBgVar, icon, href,
}: {
  label: string; value: number | string; sub?: string;
  iconBgVar: string; icon: React.ReactNode; href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--card-bg)", borderRadius: "16px", padding: "28px 24px",
          border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)",
          cursor: "pointer", transition: "all 0.2s", display: "flex",
          alignItems: "center", gap: "20px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--card-shadow)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        <div style={{
          width: "56px", height: "56px", borderRadius: "14px",
          background: `var(${iconBgVar})`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "26px", flexShrink: 0,
        }}>{icon}</div>
        <div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-body)", marginTop: "4px" }}>{label}</div>
          {sub && <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{sub}</div>}
        </div>
      </div>
    </Link>
  );
}

function RecentAlertItem({ item }: { item: any }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [y, m, d] = item.expirationDate.split("T")[0].split("-").map(Number);
  const exp = new Date(y, m - 1, d);
  const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", borderRadius: "10px",
      background: isExpired ? "var(--alert-expired-bg)" : "var(--alert-soon-bg)",
      border: `1px solid ${isExpired ? "var(--alert-expired-border)" : "var(--alert-soon-border)"}`,
      marginBottom: "8px",
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>{item.itemName}</div>
        <div style={{ fontSize: "12px", color: "var(--text-body)" }}>
          {isExpired ? `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} ago`
            : `Expires in ${diffDays} day${diffDays !== 1 ? "s" : ""}`}
        </div>
      </div>
      <span style={{
        padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
        background: isExpired ? "var(--alert-expired-bg)" : "var(--alert-soon-bg)",
        color: isExpired ? "var(--alert-expired-text)" : "var(--alert-soon-text)",
        border: `1px solid ${isExpired ? "var(--alert-expired-border)" : "var(--alert-soon-border)"}`,
      }}>{isExpired ? "EXPIRED" : "SOON"}</span>
    </div>
  );
}

function LowStockItem({ item }: { item: any }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", borderRadius: "10px",
      background: "var(--alert-low-bg)", border: "1px solid var(--alert-low-border)", marginBottom: "8px",
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>{item.itemName}</div>
        <div style={{ fontSize: "12px", color: "var(--text-body)" }}>
          {Number(item.quantity)} {item.unitLabel || "units"} remaining
        </div>
      </div>
      <span style={{
        padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
        background: "var(--alert-low-badge-bg)", color: "var(--alert-low-text)",
      }}>LOW</span>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status, update: updateSession } = useSession({ required: true });
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  // Verify first-login status directly from the DB rather than trusting the
  // JWT alone. The JWT value can be stale after hot-reloads or token refreshes
  // (e.g. after a code push in dev). The DB is always the source of truth.
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((profile) => {
        // Show onboarding only if the DB confirms they haven't been through it
        setShowOnboarding(!profile.hasLoggedInBefore);
      })
      .catch(() => {
        // Fallback to JWT value if the fetch fails
        setShowOnboarding(session?.user?.isFirstLogin ?? false);
      });
  }, [status]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    // Refresh the session token so isFirstLogin is up-to-date everywhere
    await updateSession();
  };

  const { data: pantryData, isLoading } = useQuery({
    queryKey: ["pantry", session?.user?.email],
    queryFn: () => fetch("/api/pantry").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-body)" }}>Loading your pantry...</div>
      </AppShell>
    );
  }

  const allItems: any[] = [];
  if (Array.isArray(pantryData)) {
    pantryData.forEach((cat: any) => { if (cat.items) allItems.push(...cat.items); });
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const parseLocal = (s: string) => { const [y,m,d] = s.split("T")[0].split("-").map(Number); return new Date(y,m-1,d); };

  const totalItems = allItems.length;
  const lowStockItems = allItems.filter(
    (item) => Number(item.quantity) <= Number(item.lowThreshold) && Number(item.lowThreshold) > 0
  );
  const expiringItems = allItems
    .filter((item) => {
      if (!item.expirationDate) return false;
      const diffDays = Math.round((parseLocal(item.expirationDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    })
    .sort((a, b) => parseLocal(a.expirationDate).getTime() - parseLocal(b.expirationDate).getTime());

  const categoryCount = Array.isArray(pantryData) ? pantryData.length : 0;
  const recentAlerts = expiringItems.slice(0, 5);
  const recentLowStock = lowStockItems.slice(0, 5);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppShell>
      {showOnboarding && (
        <FirstTimeOnboarding
          userName={session?.user?.name || "there"}
          onComplete={handleOnboardingComplete}
        />
      )}
      <div className="page-content">
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
            {greeting}, {session?.user?.name?.split(" ")[0] || "Chef"} 👋
          </h1>
          <p style={{ color: "var(--text-body)", marginTop: "6px", fontSize: "15px" }}>
            Here's what's happening in your pantry today.
          </p>
        </div>

        <div className="stat-grid-3">
          <StatCard label="Total Items" value={totalItems} sub={`Across ${categoryCount} categories`} iconBgVar="--stat-icon-blue" icon="🥫" href="/pantry" />
          <StatCard label="Low in Stock" value={lowStockItems.length} sub="Need restocking" iconBgVar="--stat-icon-orange" icon="🛒" href="/shopping" />
          <StatCard label="Expiring Soon" value={expiringItems.length} sub="Within 7 days" iconBgVar="--stat-icon-red" icon="⏰" href="/alerts" />
        </div>

        <div className="grid-2-col">
          <div style={{ background: "var(--card-bg)", borderRadius: "16px", padding: "24px", border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>🔔 Expiry Alerts</h2>
              <Link href="/alerts" style={{ fontSize: "13px", color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
            </div>
            {recentAlerts.length > 0 ? recentAlerts.map((item) => <RecentAlertItem key={item.id} item={item} />) : (
              <div style={{ textAlign: "center", padding: "32px", color: "var(--text-secondary)", fontSize: "14px" }}>✅ No items expiring soon!</div>
            )}
          </div>

          <div style={{ background: "var(--card-bg)", borderRadius: "16px", padding: "24px", border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>🛒 Low Stock</h2>
              <Link href="/shopping" style={{ fontSize: "13px", color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
            </div>
            {recentLowStock.length > 0 ? recentLowStock.map((item) => <LowStockItem key={item.id} item={item} />) : (
              <div style={{ textAlign: "center", padding: "32px", color: "var(--text-secondary)", fontSize: "14px" }}>✅ All items are well stocked!</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
