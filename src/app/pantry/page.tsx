"use client";

import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import AppShell from "@/components/AppShell";
import AddItemForm from "@/components/addItemModal";
import DeleteButton from "@/components/DeleteButton";
import QuantityAdjuster from "@/components/QuantityAdjuster";
import UnitDropdown from "@/components/UnitDropdown";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SortField = "itemName" | "category" | "quantity" | "unitLabel" | "lowThreshold" | "expirationDate";
type SortDir = "asc" | "desc";

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getExpiryBadge(dateStr: string | null) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = parseLocalDate(dateStr);
  const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return { label: "Expired", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
  if (diffDays === 0) return { label: "Today",   bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" };
  if (diffDays <= 5)  return { label: `${diffDays}d`, bg: "#fffbeb", color: "#ca8a04", border: "#fde68a" };
  return null;
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditItemModal({
  item,
  categories,
  unitSystem,
  onClose,
  onSaved,
}: {
  item: any;
  categories: any[];
  unitSystem: "Imperial" | "Metric";
  onClose: () => void;
  onSaved: () => void;
}) {
  const [itemName, setItemName]     = useState(item.itemName ?? "");
  const [categoryId, setCategoryId] = useState(item.categoryId ?? "");
  const [quantity, setQuantity]     = useState(String(Number(item.quantity)));
  const [unitLabel, setUnitLabel]   = useState(item.unitLabel ?? "");
  const [threshold, setThreshold]   = useState(String(Number(item.lowThreshold)));
  const [expDate, setExpDate]       = useState(
    item.expirationDate ? item.expirationDate.split("T")[0] : ""
  );
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!itemName.trim()) { setError("Item name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/pantry/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: itemName.trim(),
          categoryId: categoryId || null,
          quantity: parseFloat(quantity) || 0,
          unitLabel: unitLabel.trim() || null,
          lowThreshold: parseFloat(threshold) || 0,
          expirationDate: expDate || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0",
    borderRadius: "8px", fontSize: "14px", color: "#2D3748",
    background: "#fff", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "12px", fontWeight: 700,
    color: "#4A5568", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em",
  };
  const fieldStyle: React.CSSProperties = { marginBottom: "16px" };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "480px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
          animation: "modalIn 0.18s ease",
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #E2E8F0",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#F7FAFC",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#2D3748" }}>Edit Item</h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#A0AEC0" }}>{item.itemName}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", fontSize: "20px", cursor: "pointer",
              color: "#A0AEC0", lineHeight: 1, padding: "2px 6px", borderRadius: "6px",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#2D3748"; (e.currentTarget as HTMLElement).style.background = "#E2E8F0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#A0AEC0"; (e.currentTarget as HTMLElement).style.background = "none"; }}
          >✕</button>
        </div>

        {/* Modal body */}
        <div style={{ padding: "20px 24px 4px" }}>

          {/* Item Name */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Item Name</label>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              style={inputStyle}
              placeholder="e.g. Whole Milk"
            />
          </div>

          {/* Category */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">— Uncategorized —</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.color ? `● ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
            {/* Color preview of selected category */}
            {categoryId && (() => {
              const selected = categories.find((c: any) => c.id === categoryId);
              return selected?.color ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                  <div style={{
                    width: "12px", height: "12px", borderRadius: "50%",
                    background: selected.color, border: "1px solid rgba(0,0,0,0.1)",
                  }} />
                  <span style={{ fontSize: "12px", color: "#4A5568" }}>
                    {selected.name} — <span style={{ fontFamily: "monospace" }}>{selected.color}</span>
                  </span>
                </div>
              ) : null;
            })()}
          </div>

          {/* Quantity + Unit side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Quantity</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Unit</label>
              <UnitDropdown
                value={unitLabel}
                onChange={setUnitLabel}
                unitSystem={unitSystem}
                inputStyle={inputStyle}
              />
            </div>
          </div>

          {/* Threshold + Expiry side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Low Stock Threshold</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                style={inputStyle}
                placeholder="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Expiration Date</label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              padding: "10px 12px", borderRadius: "8px", marginBottom: "12px",
              background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px",
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div style={{
          padding: "12px 24px 20px",
          display: "flex", gap: "10px", justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: 500,
              background: "#F7FAFC", color: "#4A5568", border: "1px solid #E2E8F0", cursor: "pointer",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E2E8F0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7FAFC"; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 700,
              background: saving ? "#93b4d4" : "#4A6FA5", color: "#fff",
              border: "none", cursor: saving ? "not-allowed" : "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLElement).style.background = "#3d5c8a"; }}
            onMouseLeave={(e) => { if (!saving) (e.currentTarget as HTMLElement).style.background = "#4A6FA5"; }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function PantryRow({
  item,
  categoryName,
  categoryColor,
  categories,
  sessionEmail,
  unitSystem,
  onEdit,
}: {
  item: any;
  categoryName: string;
  categoryColor?: string | null;
  categories: any[];
  sessionEmail: any;
  unitSystem: "Imperial" | "Metric";
  onEdit: (item: any) => void;
}) {
  const queryClient = useQueryClient();
  const [expDate, setExpDate] = useState<string>(
    item.expirationDate ? item.expirationDate.split("T")[0] : ""
  );
  const [unitLabel, setUnitLabel] = useState<string>(item.unitLabel ?? "");
  const badge = getExpiryBadge(expDate);

  const saveUnit = async (val: string) => {
    setUnitLabel(val);
    await fetch(`/api/pantry/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitLabel: val || null }),
    });
    queryClient.invalidateQueries({ queryKey: ["pantry", sessionEmail] });
  };

  return (
    <tr
      style={{ borderBottom: "1px solid #E2E8F0", transition: "background 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F7FAFC")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Name */}
      <td style={{ padding: "13px 16px", fontSize: "14px", fontWeight: 600, color: "#2D3748", whiteSpace: "nowrap" }}>
        {item.itemName}
      </td>

      {/* Category */}
      <td style={{ padding: "13px 16px" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "3px 10px", borderRadius: "20px",
          fontSize: "12px", fontWeight: 600,
          background: categoryColor ? `${categoryColor}22` : "#EBF4FF",
          color: categoryColor || "#4A6FA5",
          border: `1px solid ${categoryColor ? `${categoryColor}55` : "#BED3F3"}`,
        }}>
          <span style={{
            width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
            background: categoryColor || "#4A6FA5",
          }} />
          {categoryName}
        </span>
      </td>

      {/* Quantity */}
      <td style={{ padding: "13px 16px" }}>
        <QuantityAdjuster itemId={item.id} currentQty={Number(item.quantity)} />
      </td>

      {/* Unit — inline dropdown */}
      <td style={{ padding: "8px 16px", minWidth: "160px", maxWidth: "200px" }}>
        <UnitDropdown
          value={unitLabel}
          onChange={saveUnit}
          unitSystem={unitSystem}
          placeholder="Set unit…"
          inputStyle={{ fontSize: "13px", padding: "6px 10px" }}
        />
      </td>

      {/* Threshold */}
      <td style={{ padding: "13px 16px", fontSize: "13px", textAlign: "center" }}>
        {Number(item.lowThreshold) > 0
          ? <span style={{ fontWeight: 600, color: Number(item.quantity) <= Number(item.lowThreshold) ? "#ea580c" : "#4A5568" }}>
              {Number(item.lowThreshold)}
            </span>
          : <span style={{ color: "#A0AEC0", fontStyle: "italic" }}>—</span>
        }
      </td>

      {/* Expiration Date */}
      <td style={{ padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="date"
            value={expDate}
            onChange={async (e) => {
              setExpDate(e.target.value);
              await fetch(`/api/pantry/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ expirationDate: e.target.value }),
              });
              queryClient.invalidateQueries({ queryKey: ["pantry", sessionEmail] });
            }}
            style={{
              border: "1px solid #E2E8F0", borderRadius: "8px",
              padding: "5px 8px", fontSize: "12px", color: "#2D3748",
              background: "#fff", outline: "none", cursor: "pointer",
            }}
          />
          {badge && (
            <span style={{
              padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
              background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
              whiteSpace: "nowrap",
            }}>
              {badge.label}
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td style={{ padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <button
            onClick={() => onEdit(item)}
            title="Edit item"
            style={{
              padding: "5px 12px", borderRadius: "7px", fontSize: "12px", fontWeight: 600,
              background: "#EBF4FF", color: "#4A6FA5", border: "1px solid #BED3F3",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#4A6FA5";
              (e.currentTarget as HTMLElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#EBF4FF";
              (e.currentTarget as HTMLElement).style.color = "#4A6FA5";
            }}
          >
            Edit
          </button>
          <DeleteButton itemId={item.id} />
        </div>
      </td>
    </tr>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <span style={{ color: "#D1D5DB", marginLeft: "4px" }}>↕</span>;
  return <span style={{ color: "#4A6FA5", marginLeft: "4px" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PantryPage() {
  const { data: session, status } = useSession({ required: true });
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("itemName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["pantry", session?.user?.email],
    queryFn: () => fetch("/api/pantry").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ["categories", session?.user?.email],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: () => fetch("/api/profile").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  const unitSystem: "Imperial" | "Metric" = profile?.unitPref === "Imperial" ? "Imperial" : "Metric";

  const allItems = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.flatMap((cat: any) =>
      (cat.items || []).map((item: any) => ({
        ...item,
        categoryName: cat.name ?? "Uncategorized",
        categoryColor: cat.color ?? null,
      }))
    );
  }, [data]);

  const filteredSorted = useMemo(() => {
    let rows = allItems.filter((item) => {
      const matchSearch =
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || item.categoryName === categoryFilter;
      return matchSearch && matchCat;
    });

    rows.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortField === "category")          { aVal = a.categoryName;    bVal = b.categoryName; }
      else if (sortField === "quantity")     { aVal = Number(a.quantity); bVal = Number(b.quantity); }
      else if (sortField === "lowThreshold") { aVal = Number(a.lowThreshold); bVal = Number(b.lowThreshold); }
      else if (sortField === "expirationDate") {
        aVal = a.expirationDate ? new Date(a.expirationDate).getTime() : Infinity;
        bVal = b.expirationDate ? new Date(b.expirationDate).getTime() : Infinity;
      } else {
        aVal = (a[sortField] ?? "").toString().toLowerCase();
        bVal = (b[sortField] ?? "").toString().toLowerCase();
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [allItems, search, categoryFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  if (status === "loading" || isLoading || catsLoading) {
    return (
      <AppShell>
        <div style={{ padding: "48px", textAlign: "center", color: "#4A5568" }}>Loading pantry...</div>
      </AppShell>
    );
  }

  const thStyle = (field: SortField): React.CSSProperties => ({
    padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "#4A5568",
    textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left",
    cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
    background: sortField === field ? "#F0F4FF" : "#F7FAFC",
    borderBottom: "2px solid #E2E8F0",
  });

  return (
    <AppShell>
      <div style={{ padding: "40px 48px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#2D3748", margin: 0 }}>Pantry Inventory</h1>
            <p style={{ color: "#4A5568", marginTop: "6px", fontSize: "15px" }}>
              {filteredSorted.length} of {allItems.length} item{allItems.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link href="/scan" style={{ padding: "10px 18px", borderRadius: "10px", background: "#EBF4FF", color: "#4A6FA5", fontWeight: 600, fontSize: "14px", textDecoration: "none", border: "1px solid #BED3F3" }}>
              📷 Scan Barcode
            </Link>
            <AddItemForm categories={categories || []} unitSystem={unitSystem} />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input
            placeholder="Search by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1", minWidth: "200px", maxWidth: "360px", padding: "9px 14px",
              border: "1px solid #E2E8F0", borderRadius: "10px",
              fontSize: "14px", color: "#2D3748", background: "#fff", outline: "none",
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "9px 14px", border: "1px solid #E2E8F0", borderRadius: "10px",
              fontSize: "14px", color: "#2D3748", background: "#fff", outline: "none", cursor: "pointer",
            }}
          >
            <option value="all">All Categories</option>
            {(categories || []).map((cat: any) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "820px" }}>
              <thead>
                <tr>
                  <th style={thStyle("itemName")} onClick={() => handleSort("itemName")}>
                    Name <SortIcon field="itemName" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th style={thStyle("category")} onClick={() => handleSort("category")}>
                    Category <SortIcon field="category" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th style={thStyle("quantity")} onClick={() => handleSort("quantity")}>
                    Quantity <SortIcon field="quantity" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th style={thStyle("unitLabel")} onClick={() => handleSort("unitLabel")}>
                    Unit <SortIcon field="unitLabel" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th style={{ ...thStyle("lowThreshold"), textAlign: "center" }} onClick={() => handleSort("lowThreshold")}>
                    Threshold <SortIcon field="lowThreshold" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th style={thStyle("expirationDate")} onClick={() => handleSort("expirationDate")}>
                    Expiration Date <SortIcon field="expirationDate" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th style={{ ...thStyle("itemName" as SortField), cursor: "default", textAlign: "center", background: "#F7FAFC" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSorted.length > 0 ? (
                  filteredSorted.map((item: any) => (
                    <PantryRow
                      key={item.id}
                      item={item}
                      categoryName={item.categoryName}
                      categoryColor={item.categoryColor}
                      categories={categories || []}
                      sessionEmail={session?.user?.email}
                      unitSystem={unitSystem}
                      onEdit={setEditingItem}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#A0AEC0", fontSize: "14px" }}>
                      {allItems.length === 0 ? "Your pantry is empty — add your first item!" : "No items match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {filteredSorted.length > 0 && (
            <div style={{
              padding: "12px 20px", borderTop: "1px solid #E2E8F0",
              background: "#F7FAFC", display: "flex", gap: "20px",
              fontSize: "12px", color: "#A0AEC0",
            }}>
              <span>{filteredSorted.length} item{filteredSorted.length !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span style={{ color: "#ea580c" }}>
                {filteredSorted.filter((i: any) => Number(i.quantity) <= Number(i.lowThreshold) && Number(i.lowThreshold) > 0).length} low stock
              </span>
              <span>·</span>
              <span style={{ color: "#dc2626" }}>
                {filteredSorted.filter((i: any) => {
                  if (!i.expirationDate) return false;
                  const today = new Date(); today.setHours(0,0,0,0);
                  return Math.round((parseLocalDate(i.expirationDate).getTime() - today.getTime()) / 86400000) <= 5;
                }).length} expiring soon
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          categories={categories || []}
          unitSystem={unitSystem}
          onClose={() => setEditingItem(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["pantry", session?.user?.email] })}
        />
      )}
    </AppShell>
  );
}
