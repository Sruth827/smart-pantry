"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";

function parseExpiry(raw: string): Date {
  const datePart = raw.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(raw: string): string {
  return parseExpiry(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function AlertAccordion({
  title, subtitle, items, accentColor, borderVar, bgVar, badgeFn, defaultOpen = false,
}: {
  title: string; subtitle: string; items: any[];
  accentColor: string; borderVar: string; bgVar: string;
  badgeFn: (diffDays: number) => string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: "12px", borderRadius: "14px", border: `1px solid var(${borderVar})`, overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", background: `var(${bgVar})`, border: "none", cursor: "pointer",
          textAlign: "left", transition: "filter 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(0.95)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "4px", height: "38px", borderRadius: "4px", background: accentColor, flexShrink: 0 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--foreground)" }}>{title}</span>
              <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, color: accentColor, background: "var(--card-bg)", border: `1px solid var(${borderVar})` }}>
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            {subtitle && <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{subtitle}</div>}
          </div>
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, flexShrink: 0, marginLeft: "12px", transition: "transform 0.2s ease", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>

      {open && (
        <div style={{ background: "var(--card-bg)", borderTop: `1px solid var(${borderVar})`, padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "10px", background: `var(${bgVar})`, border: `1px solid var(${borderVar})` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: accentColor, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>{item.itemName}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{item.categoryName} &middot; {formatDate(item.expirationDate)}</div>
                </div>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, color: accentColor, background: "var(--card-bg)", border: `1px solid var(${borderVar})`, whiteSpace: "nowrap", flexShrink: 0, marginLeft: "12px" }}>
                {badgeFn(item.diffDays)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const { data: session, status } = useSession({ required: true });

  const { data: pantryData, isLoading } = useQuery({
    queryKey: ["pantry", session?.user?.email],
    queryFn: () => fetch("/api/pantry").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  if (status === "loading" || isLoading) {
    return <AppShell><div style={{ padding: "48px", textAlign: "center", color: "var(--text-body)" }}>Loading alerts...</div></AppShell>;
  }

  const allItems: any[] = [];
  if (Array.isArray(pantryData)) {
    pantryData.forEach((cat: any) => {
      (cat.items || []).forEach((item: any) => {
        if (item.expirationDate) allItems.push({ ...item, categoryName: cat.name ?? "Uncategorized" });
      });
    });
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expired: any[] = [], thisWeek: any[] = [], later: any[] = [];

  allItems.forEach((item) => {
    const exp = parseExpiry(item.expirationDate);
    const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const enriched = { ...item, diffDays };
    if (diffDays < 0)       expired.push(enriched);
    else if (diffDays <= 7) thisWeek.push(enriched);
    else                    later.push(enriched);
  });

  const byDate = (a: any, b: any) => parseExpiry(a.expirationDate).getTime() - parseExpiry(b.expirationDate).getTime();
  expired.sort(byDate); thisWeek.sort(byDate); later.sort(byDate);

  const urgentCount = expired.length + thisWeek.length;
  const totalTracked = allItems.length;

  const summaryCards = [
    { label: "Expired", count: expired.length, color: "var(--alert-expired-text)", bgVar: "--alert-expired-bg", borderVar: "--alert-expired-border" },
    { label: "Expiring This Week", count: thisWeek.length, color: "var(--alert-soon-text)", bgVar: "--alert-soon-bg", borderVar: "--alert-soon-border" },
    { label: "Expiring Later", count: later.length, color: "var(--brand)", bgVar: "--btn-edit-bg", borderVar: "--btn-edit-border" },
  ];

  return (
    <AppShell>
      <div style={{ padding: "40px 48px", maxWidth: "820px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Expiry Alerts</h1>
          <p style={{ color: "var(--text-body)", marginTop: "6px", fontSize: "15px" }}>
            {urgentCount > 0
              ? `${urgentCount} item${urgentCount !== 1 ? "s" : ""} need${urgentCount === 1 ? "s" : ""} your attention.`
              : totalTracked > 0
              ? "Everything looks good — nothing urgent this week."
              : "No expiration dates are being tracked yet."}
          </p>
        </div>

        {totalTracked > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "28px" }}>
            {summaryCards.map(({ label, count, color, bgVar, borderVar }) => (
              <div key={label} style={{ background: `var(${bgVar})`, border: `1px solid var(${borderVar})`, borderRadius: "12px", padding: "14px 18px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: "12px", color: "var(--text-body)", marginTop: "4px", fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {totalTracked === 0 ? (
          <div style={{ background: "var(--card-bg)", borderRadius: "16px", padding: "56px 48px", textAlign: "center", border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ color: "var(--foreground)", fontWeight: 700, margin: "0 0 8px" }}>No expiration dates tracked</h2>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>Add expiration dates to your pantry items to see alerts here.</p>
          </div>
        ) : (
          <>
            <AlertAccordion title="Expired" subtitle={expired.length > 0 ? `Most overdue: ${Math.abs(expired[0].diffDays)}d ago (${formatDate(expired[0].expirationDate)})` : ""} items={expired} accentColor="var(--alert-expired-text)" borderVar="--alert-expired-border" bgVar="--alert-expired-bg" badgeFn={(d) => d === 0 ? "Today" : `${Math.abs(d)}d ago`} defaultOpen={true} />
            <AlertAccordion title="Expiring Within a Week" subtitle={thisWeek.length > 0 ? (thisWeek[0].diffDays === 0 ? "Earliest: expires today" : `Earliest: ${thisWeek[0].diffDays}d left — ${formatDate(thisWeek[0].expirationDate)}`) : ""} items={thisWeek} accentColor="var(--alert-soon-text)" borderVar="--alert-soon-border" bgVar="--alert-soon-bg" badgeFn={(d) => d === 0 ? "Today!" : `${d}d left`} defaultOpen={true} />
            <AlertAccordion title="Expiring in More Than 2 Weeks" subtitle={later.length > 0 ? `Next up in ${later[0].diffDays}d — ${formatDate(later[0].expirationDate)}` : ""} items={later} accentColor="var(--brand)" borderVar="--btn-edit-border" bgVar="--btn-edit-bg" badgeFn={(d) => `${d}d left`} defaultOpen={false} />
          </>
        )}
      </div>
    </AppShell>
  );
}
