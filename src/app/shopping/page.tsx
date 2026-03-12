"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import AppShell from "@/components/AppShell";

type ViewMode = "alphabetical" | "category";

// ─── Single item row ──────────────────────────────────────────────────────────

function ShoppingItem({
  item,
  isChecked,
  categoryColor,
  onToggle,
}: {
  item: any;
  isChecked: boolean;
  categoryColor?: string | null;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: "14px",
        padding: "13px 20px",
        borderBottom: "1px solid #E2E8F0",
        cursor: "pointer",
        opacity: isChecked ? 0.45 : 1,
        transition: "opacity 0.15s, background 0.15s",
        background: isChecked ? "#F7FAFC" : "#fff",
      }}
      onMouseEnter={(e) => {
        if (!isChecked) (e.currentTarget as HTMLElement).style.background = "#F7FAFC";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = isChecked ? "#F7FAFC" : "#fff";
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
        border: `2px solid ${isChecked ? "#4A6FA5" : "#CBD5E0"}`,
        background: isChecked ? "#4A6FA5" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {isChecked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: "14px", color: "#2D3748",
          textDecoration: isChecked ? "line-through" : "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {item.itemName}
        </div>
        <div style={{ fontSize: "12px", color: "#A0AEC0", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Category dot */}
          <span style={{
            width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
            background: categoryColor || "#A0AEC0",
            display: "inline-block",
          }} />
          <span>{item.categoryName}</span>
          <span style={{ color: "#E2E8F0" }}>·</span>
          <span>
            Has {Number(item.quantity)} {item.unitLabel || "units"} (min: {Number(item.lowThreshold)})
          </span>
        </div>
      </div>

      {/* Badge — only when not checked */}
      {!isChecked && (
        <span style={{
          padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
          background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa",
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          LOW
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShoppingPage() {
  const { data: session, status } = useSession({ required: true });
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewMode>("alphabetical");

  const { data: pantryData, isLoading } = useQuery({
    queryKey: ["pantry", session?.user?.email],
    queryFn: () => fetch("/api/pantry").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", session?.user?.email],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  // Build color lookup: categoryName → color
  const colorMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(categoriesData)) {
      categoriesData.forEach((cat: any) => {
        if (cat.color) map[cat.name] = cat.color;
      });
    }
    return map;
  }, [categoriesData]);

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div style={{ padding: "48px", textAlign: "center", color: "#4A5568" }}>
          Loading shopping list...
        </div>
      </AppShell>
    );
  }

  // Collect all low-stock items
  const allItems: any[] = [];
  if (Array.isArray(pantryData)) {
    pantryData.forEach((cat: any) => {
      (cat.items || []).forEach((item: any) => {
        if (Number(item.quantity) <= Number(item.lowThreshold) && Number(item.lowThreshold) > 0) {
          allItems.push({ ...item, categoryName: cat.name ?? "Uncategorized" });
        }
      });
    });
  }

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const unchecked = allItems.filter((i) => !checked.has(i.id));
  const checkedItems = allItems.filter((i) => checked.has(i.id));

  // ── Alphabetical view data ──
  const alphaSorted = [...unchecked].sort((a, b) =>
    a.itemName.localeCompare(b.itemName)
  );

  // ── Category view data ──
  const byCategory = useMemo(() => {
    const map: Record<string, any[]> = {};
    unchecked.forEach((item) => {
      const key = item.categoryName || "Uncategorized";
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    // Sort each group alphabetically
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.itemName.localeCompare(b.itemName)));
    // Sort category names alphabetically, "Uncategorized" last
    return Object.entries(map).sort(([a], [b]) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });
  }, [unchecked]);

  // Shared styles
  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: active ? 700 : 500,
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s",
    background: active ? "#4A6FA5" : "transparent",
    color: active ? "#fff" : "#4A5568",
  });

  return (
    <AppShell>
      <div style={{ padding: "40px 48px", maxWidth: "720px" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#2D3748", margin: 0 }}>
            Shopping List
          </h1>
          <p style={{ color: "#4A5568", marginTop: "6px", fontSize: "15px" }}>
            {allItems.length === 0
              ? "All stocked up — nothing needs restocking."
              : `${allItems.length} item${allItems.length !== 1 ? "s" : ""} below restock threshold.`}
          </p>
        </div>

        {allItems.length === 0 ? (
          <div style={{
            background: "#fff", borderRadius: "16px", padding: "56px 48px",
            textAlign: "center", border: "1px solid #E2E8F0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>🛒</div>
            <h2 style={{ color: "#2D3748", fontWeight: 700, margin: "0 0 8px" }}>All stocked up!</h2>
            <p style={{ color: "#718096", margin: 0 }}>No items are currently below their restock threshold.</p>
          </div>
        ) : (
          <>
            {/* ── View toggle ── */}
            <div style={{
              display: "inline-flex",
              background: "#F7FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "4px",
              marginBottom: "20px",
              gap: "2px",
            }}>
              <button style={toggleBtnStyle(view === "alphabetical")} onClick={() => setView("alphabetical")}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {/* A-Z icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 6h16M4 12h10M4 18h6" />
                  </svg>
                  A–Z
                </span>
              </button>
              <button style={toggleBtnStyle(view === "category")} onClick={() => setView("category")}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {/* Category/folder icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  By Category
                </span>
              </button>
            </div>

            {/* ── Need to buy ── */}
            {unchecked.length > 0 && (
              <div style={{
                background: "#fff", borderRadius: "14px",
                border: "1px solid #E2E8F0", overflow: "hidden",
                marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                {/* Section header */}
                <div style={{
                  padding: "13px 20px",
                  background: "#F7FAFC",
                  borderBottom: "1px solid #E2E8F0",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#2D3748", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Need to buy — {unchecked.length}
                  </span>
                  {checked.size > 0 && (
                    <button
                      onClick={() => setChecked(new Set())}
                      style={{ fontSize: "12px", color: "#4A6FA5", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      Clear all checks
                    </button>
                  )}
                </div>

                {/* ── Alphabetical view ── */}
                {view === "alphabetical" && alphaSorted.map((item) => (
                  <ShoppingItem
                    key={item.id}
                    item={item}
                    isChecked={false}
                    categoryColor={colorMap[item.categoryName]}
                    onToggle={() => toggleCheck(item.id)}
                  />
                ))}

                {/* ── Category view ── */}
                {view === "category" && byCategory.map(([catName, items]) => (
                  <div key={catName}>
                    {/* Category header row */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 20px",
                      background: colorMap[catName] ? `${colorMap[catName]}18` : "#F0F4FF",
                      borderBottom: "1px solid #E2E8F0",
                      borderTop: "1px solid #E2E8F0",
                    }}>
                      <div style={{
                        width: "10px", height: "10px", borderRadius: "3px", flexShrink: 0,
                        background: colorMap[catName] || "#A0AEC0",
                      }} />
                      <span style={{
                        fontSize: "11px", fontWeight: 800,
                        color: colorMap[catName] || "#4A5568",
                        textTransform: "uppercase", letterSpacing: "0.07em",
                      }}>
                        {catName}
                      </span>
                      <span style={{
                        marginLeft: "auto",
                        fontSize: "11px", fontWeight: 600,
                        color: colorMap[catName] || "#A0AEC0",
                        background: "#fff",
                        padding: "1px 8px", borderRadius: "10px",
                        border: `1px solid ${colorMap[catName] ? `${colorMap[catName]}44` : "#E2E8F0"}`,
                      }}>
                        {items.length}
                      </span>
                    </div>
                    {items.map((item) => (
                      <ShoppingItem
                        key={item.id}
                        item={item}
                        isChecked={false}
                        categoryColor={colorMap[item.categoryName]}
                        onToggle={() => toggleCheck(item.id)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {unchecked.length === 0 && (
              <div style={{
                background: "#fff", borderRadius: "14px", border: "1px solid #E2E8F0",
                padding: "32px", textAlign: "center", marginBottom: "16px",
                color: "#A0AEC0", fontSize: "14px",
              }}>
                ✅ All items checked off!
              </div>
            )}

            {/* ── In cart ── */}
            {checkedItems.length > 0 && (
              <div style={{
                background: "#F7FAFC", borderRadius: "14px",
                border: "1px solid #E2E8F0", overflow: "hidden",
              }}>
                <div style={{
                  padding: "13px 20px", borderBottom: "1px solid #E2E8F0",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    In cart — {checkedItems.length}
                  </span>
                </div>
                {[...checkedItems].sort((a, b) => a.itemName.localeCompare(b.itemName)).map((item) => (
                  <ShoppingItem
                    key={item.id}
                    item={item}
                    isChecked={true}
                    categoryColor={colorMap[item.categoryName]}
                    onToggle={() => toggleCheck(item.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
