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

type SortField = "itemName" | "category" | "quantity" | "unitLabel" | "lowThreshold" | "expirationDate" | "notes";
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
  if (diffDays < 0)   return { label: "Expired", bgVar: "--alert-expired-bg", colorVar: "--alert-expired-text", borderVar: "--alert-expired-border" };
  if (diffDays === 0) return { label: "Today",   bgVar: "--alert-soon-bg",    colorVar: "--alert-soon-text",    borderVar: "--alert-soon-border" };
  if (diffDays <= 5)  return { label: `${diffDays}d`, bgVar: "--alert-soon-bg", colorVar: "--alert-soon-text", borderVar: "--alert-soon-border" };
  return null;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditItemModal({
  item, categories, unitSystem, onClose, onSaved,
}: {
  item: any; categories: any[]; unitSystem: "Imperial" | "Metric";
  onClose: () => void; onSaved: () => void;
}) {
  const [itemName, setItemName]     = useState(item.itemName ?? "");
  const [categoryId, setCategoryId] = useState(item.categoryId ?? "");
  const [quantity, setQuantity]     = useState(String(Number(item.quantity)));
  const [unitLabel, setUnitLabel]   = useState(item.unitLabel ?? "");
  const [threshold, setThreshold]   = useState(String(Number(item.lowThreshold)));
  const [expDate, setExpDate]       = useState(item.expirationDate ? item.expirationDate.split("T")[0] : "");
  const [notes, setNotes]           = useState(item.notes ?? "");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!itemName.trim()) { setError("Item name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/pantry/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: itemName.trim(), categoryId: categoryId || null,
          quantity: parseFloat(quantity) || 0, unitLabel: unitLabel.trim() || null,
          lowThreshold: parseFloat(threshold) || 0, expirationDate: expDate || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved(); onClose();
    } catch { setError("Something went wrong. Please try again."); }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1px solid var(--input-border)",
    borderRadius: "8px", fontSize: "14px", color: "var(--input-color)",
    background: "var(--input-bg)", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "12px", fontWeight: 700,
    color: "var(--text-body)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em",
  };

  return (
    <div onClick={onClose} className="modal-center-wrap" style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div onClick={(e) => e.stopPropagation()} className="modal-sheet" style={{ background: "var(--card-bg)", borderRadius: "16px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", border: "1px solid var(--card-border)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-subtle)", position: "sticky", top: 0, zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--foreground)" }}>Edit Item</h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>{item.itemName}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1, padding: "2px 6px", borderRadius: "6px" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px 4px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Item Name</label>
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} style={inputStyle} placeholder="e.g. Whole Milk" />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">— Uncategorized —</option>
              {categories.map((cat: any) => (<option key={cat.id} value={cat.id}>{cat.color ? "● " + cat.name : cat.name}</option>))}
            </select>
          </div>
          <div className="form-grid-2">
            <div><label style={labelStyle}>Quantity</label><input type="number" min="0" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Unit</label><UnitDropdown value={unitLabel} onChange={setUnitLabel} unitSystem={unitSystem} inputStyle={inputStyle} /></div>
          </div>
          <div className="form-grid-2">
            <div><label style={labelStyle}>Low Stock Threshold</label><input type="number" min="0" step="0.1" value={threshold} onChange={(e) => setThreshold(e.target.value)} style={inputStyle} placeholder="0" /></div>
            <div><label style={labelStyle}>Expiration Date</label><input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }} /></div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Notes <span style={{ fontWeight: 400, color: "var(--text-secondary)", textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. Opened, store in fridge…" style={{ ...inputStyle, resize: "vertical", minHeight: "60px", fontFamily: "inherit" }} />
          </div>
          {error && (<div style={{ padding: "10px 12px", borderRadius: "8px", marginBottom: "12px", background: "var(--alert-expired-bg)", border: "1px solid var(--alert-expired-border)", color: "var(--alert-expired-text)", fontSize: "13px" }}>{error}</div>)}
        </div>
        <div style={{ padding: "12px 24px 20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, background: "var(--btn-cancel-bg)", color: "var(--btn-cancel-color)", border: "1px solid var(--btn-cancel-border)", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "9px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, background: saving ? "#93b4d4" : "var(--brand)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// ─── Inline Notes Cell ────────────────────────────────────────────────────────

function NotesCell({ itemId, initialNotes, sessionEmail }: { itemId: string; initialNotes: string; sessionEmail: any }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(initialNotes);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setNotes(initialNotes); }, [initialNotes]);

  const save = async (val: string) => {
    const trimmed = val.trim();
    setSaving(true);
    await fetch(`/api/pantry/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: trimmed || null }),
    });
    queryClient.invalidateQueries({ queryKey: ["pantry", sessionEmail] });
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <textarea
        autoFocus value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => save(notes)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(notes); }
          if (e.key === "Escape") { setNotes(initialNotes); setEditing(false); }
        }}
        rows={2}
        style={{
          width: "100%", padding: "5px 8px", border: "1px solid var(--brand)",
          borderRadius: "7px", fontSize: "12px", color: "var(--input-color)",
          background: "var(--input-bg)", outline: "none", resize: "vertical",
          minHeight: "48px", fontFamily: "inherit", opacity: saving ? 0.6 : 1,
          boxSizing: "border-box",
        }}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      title="Click to edit notes"
      style={{
        fontSize: "12px", color: notes ? "var(--foreground)" : "var(--text-secondary)",
        fontStyle: notes ? "normal" : "italic", cursor: "text",
        padding: "4px 6px", borderRadius: "6px", minHeight: "28px",
        border: "1px solid transparent", transition: "border-color 0.15s, background 0.15s",
        wordBreak: "break-word",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--surface-subtle)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {notes || "Add notes…"}
    </div>
  );
}

// ─── Mobile Item Card ─────────────────────────────────────────────────────────

function MobileItemCard({
  item, categoryName, categoryColor, categories, sessionEmail, unitSystem, onEdit,
}: {
  item: any; categoryName: string; categoryColor?: string | null; categories: any[];
  sessionEmail: any; unitSystem: "Imperial" | "Metric"; onEdit: (item: any) => void;
}) {
  const queryClient = useQueryClient();
  const [expDate, setExpDate] = useState<string>(item.expirationDate ? item.expirationDate.split("T")[0] : "");
  const [unitLabel, setUnitLabel] = useState<string>(item.unitLabel ?? "");
  const [thresholdVal, setThresholdVal] = useState<string>(String(Number(item.lowThreshold) || ""));
  const [savingThreshold, setSavingThreshold] = useState(false);
  const badge = getExpiryBadge(expDate);
  const isLowStock = Number(item.lowThreshold) > 0 && Number(item.quantity) <= Number(item.lowThreshold);

  useEffect(() => { setThresholdVal(String(Number(item.lowThreshold) || "")); }, [item.lowThreshold]);

  const saveUnit = async (val: string) => {
    setUnitLabel(val);
    await fetch(`/api/pantry/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unitLabel: val || null }) });
    queryClient.invalidateQueries({ queryKey: ["pantry", sessionEmail] });
  };

  const saveThreshold = async (val: string) => {
    const parsed = parseFloat(val) || 0;
    setSavingThreshold(true);
    await fetch(`/api/pantry/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lowThreshold: parsed }) });
    queryClient.invalidateQueries({ queryKey: ["pantry", sessionEmail] });
    setSavingThreshold(false);
  };

  return (
    <div style={{
      background: "var(--card-bg)",
      border: `1px solid ${badge ? "var(" + badge.borderVar + ")" : isLowStock ? "var(--alert-soon-border)" : "var(--card-border)"}`,
      borderRadius: "14px",
      padding: "14px 16px",
      marginBottom: "10px",
      boxShadow: "var(--card-shadow)",
    }}>
      {/* Row 1: name + action buttons */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--foreground)", wordBreak: "break-word", lineHeight: 1.3 }}>
            {item.itemName}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button onClick={() => onEdit(item)} style={{ padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: "var(--btn-edit-bg)", color: "var(--btn-edit-color)", border: "1px solid var(--btn-edit-border)", cursor: "pointer" }}>Edit</button>
          <DeleteButton itemId={item.id} />
        </div>
      </div>

      {/* Row 2: category + badges */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: categoryColor ? categoryColor + "22" : "var(--btn-edit-bg)", color: categoryColor || "var(--brand)", border: "1px solid " + (categoryColor ? categoryColor + "55" : "var(--btn-edit-border)") }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: categoryColor || "var(--brand)" }} />
          {categoryName}
        </span>
        {badge && <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "var(" + badge.bgVar + ")", color: "var(" + badge.colorVar + ")", border: "1px solid var(" + badge.borderVar + ")" }}>{badge.label}</span>}
        {isLowStock && !badge && <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "var(--alert-soon-bg)", color: "var(--alert-soon-text)", border: "1px solid var(--alert-soon-border)" }}>Low Stock</span>}
      </div>

      {/* Row 3: qty adjuster + unit */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
        <QuantityAdjuster itemId={item.id} currentQty={Number(item.quantity)} />
        <div style={{ flex: 1, minWidth: "130px", maxWidth: "200px" }}>
          <UnitDropdown value={unitLabel} onChange={saveUnit} unitSystem={unitSystem} placeholder="Set unit…" inputStyle={{ fontSize: "13px", padding: "6px 10px" }} />
        </div>
      </div>

      {/* Row 4: threshold + expiry side by side */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: isLowStock ? "var(--alert-soon-text)" : "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
            Min Stock
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={thresholdVal}
            placeholder="0"
            onChange={(e) => setThresholdVal(e.target.value)}
            onBlur={(e) => saveThreshold(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            style={{
              width: "60px", padding: "5px 8px", border: `1px solid ${isLowStock ? "var(--alert-soon-border)" : "var(--input-border)"}`,
              borderRadius: "7px", fontSize: "13px", fontWeight: 600, textAlign: "center",
              color: isLowStock ? "var(--alert-soon-text)" : "var(--input-color)",
              background: isLowStock ? "var(--alert-soon-bg)" : "var(--input-bg)",
              outline: "none", opacity: savingThreshold ? 0.5 : 1,
              transition: "border-color 0.15s, opacity 0.15s",
            }}
            onFocusCapture={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
            onBlurCapture={(e) => { (e.target as HTMLInputElement).style.borderColor = isLowStock ? "var(--alert-soon-border)" : "var(--input-border)"; }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>Expires</span>
          <input
            type="date" value={expDate}
            onChange={async (e) => {
              setExpDate(e.target.value);
              await fetch(`/api/pantry/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expirationDate: e.target.value }) });
              queryClient.invalidateQueries({ queryKey: ["pantry", sessionEmail] });
            }}
            style={{ border: "1px solid var(--input-border)", borderRadius: "7px", padding: "5px 8px", fontSize: "12px", color: "var(--input-color)", background: "var(--input-bg)", outline: "none", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* Row 5: notes */}
      <div style={{ paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Notes</div>
        <NotesCell itemId={item.id} initialNotes={item.notes ?? ""} sessionEmail={sessionEmail} />
      </div>
    </div>
  );
}

// ─── Mobile Grouped Card ──────────────────────────────────────────────────────

function MobileGroupedCard({
  name, items, categories, sessionEmail, unitSystem, onEdit, isExpanded, onToggle,
}: {
  name: string; items: any[]; categories: any[]; sessionEmail: any;
  unitSystem: "Imperial" | "Metric"; onEdit: (item: any) => void;
  isExpanded: boolean; onToggle: () => void;
}) {
  const totalQty      = items.reduce((s, i) => s + Number(i.quantity), 0);
  const categoryColor = items[0]?.categoryColor ?? null;
  const categoryName  = items[0]?.categoryName ?? "Uncategorized";
  const units         = [...new Set(items.map((i) => i.unitLabel).filter(Boolean))].join(" / ");
  const groupThresholdValue = Number(items.find((i) => Number(i.lowThreshold) > 0)?.lowThreshold ?? 0);
  const anyLowStock = groupThresholdValue > 0 && totalQty <= groupThresholdValue;

  const worstBadge = useMemo(() => {
    const badges = items.map((i) => getExpiryBadge(i.expirationDate)).filter(Boolean) as NonNullable<ReturnType<typeof getExpiryBadge>>[];
    return badges.find((b) => b.bgVar === "--alert-expired-bg") ?? badges[0] ?? null;
  }, [items]);

  return (
    <div style={{ marginBottom: "10px" }}>
      {/* Group header */}
      <div
        onClick={onToggle}
        style={{
          background: isExpanded ? "var(--edit-row-bg)" : "var(--card-bg)",
          border: `1px solid ${worstBadge ? "var(" + worstBadge.borderVar + ")" : anyLowStock ? "var(--alert-soon-border)" : isExpanded ? "var(--edit-row-border)" : "var(--card-border)"}`,
          borderRadius: isExpanded ? "14px 14px 0 0" : "14px",
          padding: "14px 16px",
          cursor: "pointer",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "5px", background: isExpanded ? "var(--brand)" : "var(--btn-cancel-bg)", border: "1px solid " + (isExpanded ? "var(--brand)" : "var(--border)"), color: isExpanded ? "#fff" : "var(--text-secondary)", fontSize: "9px", flexShrink: 0 }}>
                {isExpanded ? "▲" : "▼"}
              </span>
              <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--foreground)" }}>{name}</span>
              <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "var(--btn-edit-bg)", color: "var(--btn-edit-color)", border: "1px solid var(--btn-edit-border)" }}>{items.length}×</span>
              {anyLowStock && <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "var(--alert-soon-bg)", color: "var(--alert-soon-text)", border: "1px solid var(--alert-soon-border)" }}>Low Stock</span>}
              {worstBadge && <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "var(" + worstBadge.bgVar + ")", color: "var(" + worstBadge.colorVar + ")", border: "1px solid var(" + worstBadge.borderVar + ")" }}>{worstBadge.label}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: categoryColor ? categoryColor + "22" : "var(--btn-edit-bg)", color: categoryColor || "var(--brand)", border: "1px solid " + (categoryColor ? categoryColor + "55" : "var(--btn-edit-border)") }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: categoryColor || "var(--brand)" }} />
                {categoryName}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: anyLowStock ? "var(--alert-soon-text)" : "var(--text-body)" }}>
                {Number.isInteger(totalQty) ? totalQty : totalQty.toFixed(1)} {units || "total"}
              </span>
            </div>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontStyle: "italic", flexShrink: 0, paddingTop: "2px" }}>
            {isExpanded ? "Collapse" : "Expand"}
          </span>
        </div>
      </div>

      {/* Expanded children */}
      {isExpanded && (
        <div style={{ border: "1px solid var(--edit-row-border)", borderTop: "none", borderRadius: "0 0 14px 14px", overflow: "hidden", background: "var(--surface-subtle)", padding: "12px" }}>
          {items.map((item, idx) => (
            <div key={item.id} style={{ marginBottom: idx < items.length - 1 ? "8px" : 0 }}>
              <MobileItemCard
                item={item}
                categoryName={item.categoryName}
                categoryColor={item.categoryColor}
                categories={categories}
                sessionEmail={sessionEmail}
                unitSystem={unitSystem}
                onEdit={onEdit}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Desktop: Single item row ─────────────────────────────────────────────────

function PantryRow({
  item, categoryName, categoryColor, categories, sessionEmail, unitSystem, onEdit, isChild,
}: {
  item: any; categoryName: string; categoryColor?: string | null; categories: any[];
  sessionEmail: any; unitSystem: "Imperial" | "Metric"; onEdit: (item: any) => void; isChild?: boolean;
}) {
  const queryClient = useQueryClient();
  const [expDate, setExpDate] = useState<string>(item.expirationDate ? item.expirationDate.split("T")[0] : "");
  const [unitLabel, setUnitLabel] = useState<string>(item.unitLabel ?? "");
  const badge = getExpiryBadge(expDate);

  const saveUnit = async (val: string) => {
    setUnitLabel(val);
    await fetch(`/api/pantry/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unitLabel: val || null }) });
    queryClient.invalidateQueries({ queryKey: ["pantry", sessionEmail] });
  };

  return (
    <tr style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--row-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td style={{ padding: "13px 16px", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>
        {isChild && <span style={{ display: "inline-block", width: "20px", marginRight: "4px", color: "var(--text-secondary)", fontSize: "14px" }}>└</span>}
        {item.itemName}
      </td>
      <td style={{ padding: "13px 16px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, background: categoryColor ? categoryColor + "22" : "var(--btn-edit-bg)", color: categoryColor || "var(--brand)", border: "1px solid " + (categoryColor ? categoryColor + "55" : "var(--btn-edit-border)") }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, background: categoryColor || "var(--brand)" }} />
          {categoryName}
        </span>
      </td>
      <td style={{ padding: "13px 16px" }}><QuantityAdjuster itemId={item.id} currentQty={Number(item.quantity)} /></td>
      <td style={{ padding: "8px 16px", minWidth: "160px", maxWidth: "200px" }}>
        <UnitDropdown value={unitLabel} onChange={saveUnit} unitSystem={unitSystem} placeholder="Set unit…" inputStyle={{ fontSize: "13px", padding: "6px 10px" }} />
      </td>
      <td style={{ padding: "13px 16px", fontSize: "13px", textAlign: "center" }}>
        {isChild ? (
          <span style={{ color: "var(--border)", fontSize: "11px" }}>—</span>
        ) : Number(item.lowThreshold) > 0 ? (
          <span style={{ fontWeight: 600, color: Number(item.quantity) <= Number(item.lowThreshold) ? "var(--alert-soon-text)" : "var(--text-body)" }}>{Number(item.lowThreshold)}</span>
        ) : (
          <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>—</span>
        )}
      </td>
      <td style={{ padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <input type="date" value={expDate}
            onChange={async (e) => {
              setExpDate(e.target.value);
              await fetch(`/api/pantry/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expirationDate: e.target.value }) });
              queryClient.invalidateQueries({ queryKey: ["pantry", sessionEmail] });
            }}
            style={{ border: "1px solid var(--input-border)", borderRadius: "8px", padding: "5px 8px", fontSize: "12px", color: "var(--input-color)", background: "var(--input-bg)", outline: "none", cursor: "pointer" }}
          />
          {badge && <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "var(" + badge.bgVar + ")", color: "var(" + badge.colorVar + ")", border: "1px solid var(" + badge.borderVar + ")", whiteSpace: "nowrap" }}>{badge.label}</span>}
        </div>
      </td>
      <td style={{ padding: "8px 16px", minWidth: "160px", maxWidth: "220px" }}>
        <NotesCell itemId={item.id} initialNotes={item.notes ?? ""} sessionEmail={sessionEmail} />
      </td>
      <td style={{ padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <button onClick={() => onEdit(item)} style={{ padding: "5px 12px", borderRadius: "7px", fontSize: "12px", fontWeight: 600, background: "var(--btn-edit-bg)", color: "var(--btn-edit-color)", border: "1px solid var(--btn-edit-border)", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--btn-edit-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--btn-edit-color)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--btn-edit-border)"; }}
          >Edit</button>
          <DeleteButton itemId={item.id} />
        </div>
      </td>
    </tr>
  );
}

// ─── Desktop: Grouped summary row ────────────────────────────────────────────

function GroupedRow({
  name, items, categories, sessionEmail, unitSystem, onEdit, isExpanded, onToggle,
}: {
  name: string; items: any[]; categories: any[]; sessionEmail: any;
  unitSystem: "Imperial" | "Metric"; onEdit: (item: any) => void;
  isExpanded: boolean; onToggle: () => void;
}) {
  const queryClient = useQueryClient();
  const totalQty      = items.reduce((s, i) => s + Number(i.quantity), 0);
  const categoryColor = items[0]?.categoryColor ?? null;
  const categoryName  = items[0]?.categoryName ?? "Uncategorized";
  const units         = [...new Set(items.map((i) => i.unitLabel).filter(Boolean))].join(" / ");
  const groupThresholdValue = Number(items.find((i) => Number(i.lowThreshold) > 0)?.lowThreshold ?? 0);
  const [thresholdInput, setThresholdInput] = useState(groupThresholdValue > 0 ? String(groupThresholdValue) : "");
  const [savingThreshold, setSavingThreshold] = useState(false);
  useEffect(() => { setThresholdInput(groupThresholdValue > 0 ? String(groupThresholdValue) : ""); }, [groupThresholdValue]);
  const anyLowStock = groupThresholdValue > 0 && totalQty <= groupThresholdValue;

  const saveGroupThreshold = async (val: string) => {
    const parsed = parseFloat(val) || 0;
    setSavingThreshold(true);
    await Promise.all(items.map((item) => fetch(`/api/pantry/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lowThreshold: parsed }) })));
    queryClient.invalidateQueries({ queryKey: ["pantry", sessionEmail] });
    setSavingThreshold(false);
  };

  const worstBadge = useMemo(() => {
    const badges = items.map((i) => getExpiryBadge(i.expirationDate)).filter(Boolean) as NonNullable<ReturnType<typeof getExpiryBadge>>[];
    return badges.find((b) => b.bgVar === "--alert-expired-bg") ?? badges[0] ?? null;
  }, [items]);

  return (
    <>
      <tr onClick={onToggle} style={{ borderBottom: isExpanded ? "none" : "1px solid var(--border)", cursor: "pointer", transition: "background 0.15s", background: isExpanded ? "var(--edit-row-bg)" : "transparent" }}
        onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = "var(--row-hover)"; }}
        onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <td style={{ padding: "13px 16px", fontSize: "14px", fontWeight: 700, color: "var(--foreground)", whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "6px", background: isExpanded ? "var(--brand)" : "var(--btn-cancel-bg)", border: "1px solid " + (isExpanded ? "var(--brand)" : "var(--border)"), color: isExpanded ? "#fff" : "var(--text-secondary)", fontSize: "10px", flexShrink: 0, transition: "all 0.2s" }}>
              {isExpanded ? "▲" : "▼"}
            </span>
            {name}
            <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "var(--btn-edit-bg)", color: "var(--btn-edit-color)", border: "1px solid var(--btn-edit-border)" }}>{items.length}×</span>
            {anyLowStock && <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "var(--alert-soon-bg)", color: "var(--alert-soon-text)", border: "1px solid var(--alert-soon-border)", whiteSpace: "nowrap" }}>Low Stock</span>}
            {worstBadge && <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "var(" + worstBadge.bgVar + ")", color: "var(" + worstBadge.colorVar + ")", border: "1px solid var(" + worstBadge.borderVar + ")", whiteSpace: "nowrap" }}>{worstBadge.label}</span>}
          </div>
        </td>
        <td style={{ padding: "13px 16px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, background: categoryColor ? categoryColor + "22" : "var(--btn-edit-bg)", color: categoryColor || "var(--brand)", border: "1px solid " + (categoryColor ? categoryColor + "55" : "var(--btn-edit-border)") }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, background: categoryColor || "var(--brand)" }} />
            {categoryName}
          </span>
        </td>
        <td style={{ padding: "13px 16px" }}><span style={{ fontSize: "14px", fontWeight: 600, color: anyLowStock ? "var(--alert-soon-text)" : "var(--text-body)" }}>{Number.isInteger(totalQty) ? totalQty : totalQty.toFixed(1)} total</span></td>
        <td style={{ padding: "13px 16px", fontSize: "13px", color: "var(--text-secondary)", fontStyle: units ? "normal" : "italic" }}>{units || "—"}</td>
        <td style={{ padding: "8px 16px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
          <input type="number" min="0" step="0.1" value={thresholdInput} placeholder="—" title="Group restock threshold"
            onChange={(e) => setThresholdInput(e.target.value)}
            onBlur={(e) => saveGroupThreshold(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            style={{ width: "64px", padding: "5px 8px", borderRadius: "7px", textAlign: "center", border: "1px solid var(--input-border)", fontSize: "13px", fontWeight: 600, color: anyLowStock ? "var(--alert-soon-text)" : "var(--input-color)", background: anyLowStock ? "var(--alert-soon-bg)" : "var(--input-bg)", outline: "none", opacity: savingThreshold ? 0.5 : 1, transition: "opacity 0.15s, border-color 0.15s", cursor: "text" }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
          />
        </td>
        <td style={{ padding: "13px 16px" }} />
        <td style={{ padding: "13px 16px" }} />
        <td style={{ padding: "13px 16px", textAlign: "center" }}><span style={{ fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic" }}>{isExpanded ? "Click to collapse" : "Click to expand"}</span></td>
      </tr>
      {isExpanded && items.map((item) => (
        <PantryRow key={item.id} item={item} categoryName={item.categoryName} categoryColor={item.categoryColor} categories={categories} sessionEmail={sessionEmail} unitSystem={unitSystem} onEdit={onEdit} isChild />
      ))}
      {isExpanded && (<tr><td colSpan={8} style={{ padding: 0, height: "3px", background: "var(--brand)", opacity: 0.25 }} /></tr>)}
    </>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <span style={{ color: "var(--border)", marginLeft: "4px" }}>↕</span>;
  return <span style={{ color: "var(--brand)", marginLeft: "4px" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
}

// ─── Bulk Add Modal ───────────────────────────────────────────────────────────

const CSV_HEADERS = ["Item Name", "Category", "Quantity", "Unit", "Low Stock Threshold", "Expiration Date (YYYY-MM-DD)", "Notes"];
const CSV_EXAMPLE_ROWS = [
  ["Whole Milk", "Dairy", "2", "L", "1", "2025-12-31", "Full fat"],
  ["Chicken Breast", "Meat", "500", "g", "200", "", "Frozen"],
  ["Olive Oil", "Pantry", "1", "bottle", "0", "", ""],
];

function downloadCsvTemplate() {
  const rows = [CSV_HEADERS, ...CSV_EXAMPLE_ROWS];
  const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "smart-pantry-bulk-add-template.csv";
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

type ParsedRow = { itemName: string; category: string; quantity: number; unitLabel: string; lowThreshold: number; expirationDate: string; notes: string; error?: string; };

function parseCsvText(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const firstCell = lines[0].split(",")[0].replace(/^"|"$/g, "").trim().toLowerCase();
  const isHeader = firstCell === "item name" || firstCell === "itemname";
  const dataLines = isHeader ? lines.slice(1) : lines;
  return dataLines.filter((l) => l.trim()).map((line): ParsedRow => {
    const fields: string[] = [];
    let cur = ""; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { fields.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    fields.push(cur.trim());
    const [rawName, rawCat, rawQty, rawUnit, rawThresh, rawExp, rawNotes] = fields;
    const itemName = rawName?.replace(/^"|"$/g, "").trim() ?? "";
    if (!itemName) return { itemName: "", category: "", quantity: 0, unitLabel: "", lowThreshold: 0, expirationDate: "", notes: "", error: "Missing item name" };
    const qty = parseFloat(rawQty ?? "0") || 0;
    const threshold = parseFloat(rawThresh ?? "0") || 0;
    const expDate = (rawExp ?? "").replace(/^"|"$/g, "").trim();
    const expValid = !expDate || /^\d{4}-\d{2}-\d{2}$/.test(expDate);
    return { itemName, category: (rawCat ?? "").replace(/^"|"$/g, "").trim(), quantity: qty, unitLabel: (rawUnit ?? "").replace(/^"|"$/g, "").trim(), lowThreshold: threshold, expirationDate: expDate, notes: (rawNotes ?? "").replace(/^"|"$/g, "").trim(), ...((!expValid) && { error: `Invalid date "${expDate}" — use YYYY-MM-DD` }) };
  });
}

function BulkAddModal({ categories, onClose, onImported }: { categories: any[]; onClose: () => void; onImported: (count: number) => void; }) {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") { setImportError("Please upload a .csv file."); return; }
    setImportError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsvText(text);
      if (parsed.length === 0) { setImportError("The CSV file appears to be empty."); return; }
      setRows(parsed); setStep("preview");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); };
  const validRows = rows.filter((r) => !r.error && r.itemName);
  const errorRows = rows.filter((r) => r.error || !r.itemName);

  const catByName = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    (categories || []).forEach((c: any) => { map[c.name.toLowerCase()] = c.id; });
    return map;
  }, [categories]);

  const handleImport = async () => {
    setImporting(true);
    try {
      await Promise.all(validRows.map((row) => fetch("/api/pantry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemName: row.itemName, quantity: row.quantity || 1, unitLabel: row.unitLabel || null, categoryId: catByName[row.category.toLowerCase()] ?? null, lowThreshold: row.lowThreshold || 0, expirationDate: row.expirationDate || null, notes: row.notes || null }) })));
      setStep("done"); onImported(validRows.length);
    } catch { setImportError("Something went wrong while importing. Please try again."); }
    finally { setImporting(false); }
  };

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid var(--input-border)", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", color: "var(--input-color)", background: "var(--input-bg)", outline: "none", boxSizing: "border-box" };

  return (
    <div onClick={onClose} className="modal-center-wrap" style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div onClick={(e) => e.stopPropagation()} className="modal-sheet" style={{ background: "var(--card-bg)", borderRadius: "18px", width: "100%", maxWidth: step === "preview" ? "820px" : "520px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 72px rgba(0,0,0,0.35)", overflow: "hidden", animation: "modalIn 0.18s ease", border: "1px solid var(--card-border)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-subtle)", flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--foreground)" }}>
              {step === "upload" && "Bulk Add Items"}{step === "preview" && `Preview — ${rows.length} row${rows.length !== 1 ? "s" : ""} found`}{step === "done" && "Import Complete!"}
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
              {step === "upload" && "Download the template, fill it in, then upload it here."}{step === "preview" && `${validRows.length} valid · ${errorRows.length} with issues`}{step === "done" && `${validRows.length} item${validRows.length !== 1 ? "s" : ""} added to your pantry.`}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1, padding: "2px 6px", borderRadius: "6px" }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {step === "upload" && (
            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: "24px", padding: "18px 20px", background: "var(--surface-subtle)", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "32px", flexShrink: 0 }}>📄</div>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--foreground)", marginBottom: "3px" }}>Step 1 — Download the CSV Template</div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Pre-formatted with the correct columns. Includes example rows.</div>
                </div>
                <button onClick={downloadCsvTemplate} style={{ padding: "9px 16px", borderRadius: "9px", background: "var(--brand)", color: "#fff", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Download
                </button>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-body)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Column Reference</div>
                <div className="form-grid-2" style={{ gap: "6px" }}>
                  {[{ col: "Item Name", note: "Required. e.g. Whole Milk" }, { col: "Category", note: "Optional. Must match an existing category name." }, { col: "Quantity", note: "Optional. Numeric. Defaults to 1." }, { col: "Unit", note: "Optional. e.g. kg, L, cans, bottle" }, { col: "Low Stock Threshold", note: "Optional. Numeric." }, { col: "Expiration Date", note: "Optional. Format: YYYY-MM-DD" }, { col: "Notes", note: "Optional. Any free-text notes." }].map(({ col, note }) => (
                    <div key={col} style={{ padding: "8px 12px", background: "var(--surface-subtle)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <div style={{ fontWeight: 700, fontSize: "12px", color: "var(--foreground)", marginBottom: "2px" }}>{col}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{note}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-body)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Step 2 — Upload Your Filled CSV</div>
              <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = ".csv,text/csv"; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f); }; input.click(); }}
                style={{ border: `2px dashed ${dragOver ? "var(--brand)" : "var(--border)"}`, borderRadius: "12px", padding: "36px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "color-mix(in srgb, var(--brand) 5%, var(--card-bg))" : "var(--surface-subtle)", transition: "all 0.15s" }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>📂</div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)", marginBottom: "4px" }}>Drop your CSV here</div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>or <span style={{ color: "var(--brand)", fontWeight: 600 }}>click to browse</span></div>
              </div>
              {importError && <div style={{ marginTop: "14px", padding: "10px 14px", background: "var(--alert-expired-bg)", border: "1px solid var(--alert-expired-border)", borderRadius: "8px", color: "var(--alert-expired-text)", fontSize: "13px" }}>⚠️ {importError}</div>}
            </div>
          )}

          {step === "preview" && (
            <div style={{ padding: "0" }}>
              {errorRows.length > 0 && (
                <div style={{ padding: "12px 20px", background: "var(--alert-expired-bg)", borderBottom: "1px solid var(--alert-expired-border)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>⚠️</span>
                  <span style={{ fontSize: "13px", color: "var(--alert-expired-text)", fontWeight: 600 }}>{errorRows.length} row{errorRows.length !== 1 ? "s" : ""} will be skipped. {validRows.length} valid row{validRows.length !== 1 ? "s" : ""} will be imported.</span>
                </div>
              )}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-subtle)", borderBottom: "2px solid var(--border)" }}>
                      {["Status", "Item Name", "Category", "Qty", "Unit", "Threshold", "Exp. Date", "Notes"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-body)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const hasError = !!row.error || !row.itemName;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: hasError ? "var(--alert-expired-bg)" : "var(--card-bg)", opacity: hasError ? 0.7 : 1 }}>
                          <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                            {hasError
                              ? <span title={row.error} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "var(--alert-expired-text)", background: "var(--alert-expired-bg)", padding: "2px 8px", borderRadius: "20px", border: "1px solid var(--alert-expired-border)" }}>✕ Skip</span>
                              : <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "var(--brand)", background: "color-mix(in srgb, var(--brand) 10%, var(--card-bg))", padding: "2px 8px", borderRadius: "20px", border: "1px solid color-mix(in srgb, var(--brand) 30%, transparent)" }}>✓ Import</span>}
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--foreground)" }}>{row.itemName || <em style={{ color: "var(--alert-expired-text)" }}>missing</em>}</td>
                          <td style={{ padding: "10px 14px", color: "var(--text-body)" }}>{row.category || <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                          <td style={{ padding: "10px 14px", color: "var(--text-body)" }}>{row.quantity || <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                          <td style={{ padding: "10px 14px", color: "var(--text-body)" }}>{row.unitLabel || <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                          <td style={{ padding: "10px 14px", color: "var(--text-body)" }}>{row.lowThreshold || <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                          <td style={{ padding: "10px 14px", color: "var(--text-body)" }}>{row.expirationDate || <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                          <td style={{ padding: "10px 14px", color: "var(--text-body)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.notes || <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {importError && <div style={{ margin: "16px 20px", padding: "10px 14px", background: "var(--alert-expired-bg)", border: "1px solid var(--alert-expired-border)", borderRadius: "8px", color: "var(--alert-expired-text)", fontSize: "13px" }}>⚠️ {importError}</div>}
            </div>
          )}

          {step === "done" && (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--foreground)", margin: "0 0 8px" }}>All done!</h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 24px" }}>{validRows.length} item{validRows.length !== 1 ? "s were" : " was"} successfully added to your pantry.</p>
              <button onClick={onClose} style={{ padding: "10px 28px", borderRadius: "10px", background: "var(--brand)", color: "#fff", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer" }}>View Pantry</button>
            </div>
          )}
        </div>

        {step !== "done" && (
          <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", justifyContent: "flex-end", background: "var(--surface-subtle)", flexShrink: 0, flexWrap: "wrap" }}>
            {step === "preview" && (
              <button onClick={() => { setStep("upload"); setRows([]); setImportError(""); }} style={{ padding: "9px 18px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, background: "var(--btn-cancel-bg)", color: "var(--btn-cancel-color)", border: "1px solid var(--btn-cancel-border)", cursor: "pointer" }}>← Back</button>
            )}
            <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, background: "var(--btn-cancel-bg)", color: "var(--btn-cancel-color)", border: "1px solid var(--btn-cancel-border)", cursor: "pointer" }}>Cancel</button>
            {step === "preview" && validRows.length > 0 && (
              <button onClick={handleImport} disabled={importing} style={{ padding: "9px 22px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, background: importing ? "#93b4d4" : "var(--brand)", color: "#fff", border: "none", cursor: importing ? "not-allowed" : "pointer" }}>
                {importing ? "Importing…" : `Import ${validRows.length} Item${validRows.length !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PantryPage() {
  const { data: session, status } = useSession({ required: true });
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [search, setSearch]               = useState("");
  const [sortField, setSortField]         = useState<SortField>("itemName");
  const [sortDir, setSortDir]             = useState<SortDir>("asc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingItem, setEditingItem]     = useState<any>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showBulkAdd, setShowBulkAdd]     = useState(false);
  const [bulkToast, setBulkToast]         = useState<string | null>(null);

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
    return data.flatMap((cat: any) => (cat.items || []).map((item: any) => ({ ...item, categoryName: cat.name ?? "Uncategorized", categoryColor: cat.color ?? null })));
  }, [data]);

  const filteredSorted = useMemo(() => {
    let rows = allItems.filter((item) => {
      const matchSearch = item.itemName.toLowerCase().includes(search.toLowerCase()) || item.categoryName.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || item.categoryName === categoryFilter;
      return matchSearch && matchCat;
    });
    rows.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortField === "category") { aVal = a.categoryName; bVal = b.categoryName; }
      else if (sortField === "quantity") { aVal = Number(a.quantity); bVal = Number(b.quantity); }
      else if (sortField === "lowThreshold") { aVal = Number(a.lowThreshold); bVal = Number(b.lowThreshold); }
      else if (sortField === "expirationDate") { aVal = a.expirationDate ? new Date(a.expirationDate).getTime() : Infinity; bVal = b.expirationDate ? new Date(b.expirationDate).getTime() : Infinity; }
      else { aVal = (a[sortField] ?? "").toString().toLowerCase(); bVal = (b[sortField] ?? "").toString().toLowerCase(); }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [allItems, search, categoryFilter, sortField, sortDir]);

  const groupedRows = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of filteredSorted) {
      const key = item.itemName.toLowerCase().trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, name: items[0].itemName, items, isGroup: items.length > 1 }));
  }, [filteredSorted]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  if (status === "loading" || isLoading || catsLoading) {
    return <AppShell><div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-body)" }}>Loading pantry...</div></AppShell>;
  }

  const thStyle = (field: SortField): React.CSSProperties => ({
    padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "var(--text-body)",
    textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left",
    cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
    background: sortField === field ? "var(--th-bg-active)" : "var(--th-bg)",
    borderBottom: "2px solid var(--th-border)",
  });

  const totalGrouped = groupedRows.filter((g) => g.isGroup).length;
  const lowStockCount = filteredSorted.filter((i: any) => Number(i.quantity) <= Number(i.lowThreshold) && Number(i.lowThreshold) > 0).length;
  const expiringSoonCount = filteredSorted.filter((i: any) => {
    if (!i.expirationDate) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((parseLocalDate(i.expirationDate).getTime() - today.getTime()) / 86400000) <= 5;
  }).length;

  return (
    <AppShell>
      <div className="page-content">

        {/* Header */}
        <div className="page-header-row" style={{ marginBottom: "16px" }}>
          <div>
            <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Pantry</h1>
            <p style={{ color: "var(--text-body)", marginTop: "4px", fontSize: "14px", margin: "4px 0 0" }}>
              {filteredSorted.length} of {allItems.length} item{allItems.length !== 1 ? "s" : ""}
              {totalGrouped > 0 && <span style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>· {totalGrouped} grouped</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {!isMobile && (
              <>
                <Link href="/scan" style={{ padding: "9px 14px", borderRadius: "10px", background: "var(--btn-edit-bg)", color: "var(--btn-edit-color)", fontWeight: 600, fontSize: "14px", textDecoration: "none", border: "1px solid var(--btn-edit-border)", whiteSpace: "nowrap" }}>📷 Scan</Link>
                <button onClick={() => setShowBulkAdd(true)} style={{ padding: "9px 14px", borderRadius: "10px", background: "var(--btn-edit-bg)", color: "var(--btn-edit-color)", fontWeight: 600, fontSize: "14px", border: "1px solid var(--btn-edit-border)", cursor: "pointer", whiteSpace: "nowrap" }}>↓ Bulk Add</button>
              </>
            )}
            <AddItemForm categories={categories || []} unitSystem={unitSystem} />
          </div>
        </div>

        {/* Mobile secondary actions */}
        {isMobile && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <Link href="/scan" style={{ flex: 1, textAlign: "center", padding: "9px", borderRadius: "10px", background: "var(--btn-edit-bg)", color: "var(--btn-edit-color)", fontWeight: 600, fontSize: "13px", textDecoration: "none", border: "1px solid var(--btn-edit-border)" }}>📷 Scan</Link>
            <button onClick={() => setShowBulkAdd(true)} style={{ flex: 1, padding: "9px", borderRadius: "10px", background: "var(--btn-edit-bg)", color: "var(--btn-edit-color)", fontWeight: 600, fontSize: "13px", border: "1px solid var(--btn-edit-border)", cursor: "pointer" }}>↓ Bulk Add</button>
          </div>
        )}

        {/* Filters */}
        <div className="toolbar-row">
          <input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: "1", minWidth: "0", padding: "9px 14px", border: "1px solid var(--input-border)", borderRadius: "10px", fontSize: "14px", color: "var(--input-color)", background: "var(--input-bg)", outline: "none" }}
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: "9px 12px", border: "1px solid var(--input-border)", borderRadius: "10px", fontSize: "14px", color: "var(--input-color)", background: "var(--input-bg)", outline: "none", cursor: "pointer" }}>
            <option value="all">All Categories</option>
            {(categories || []).map((cat: any) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
          {isMobile && (
            <select
              value={sortField + "_" + sortDir}
              onChange={(e) => { const [f, d] = e.target.value.split("_"); setSortField(f as SortField); setSortDir(d as SortDir); }}
              style={{ padding: "9px 12px", border: "1px solid var(--input-border)", borderRadius: "10px", fontSize: "14px", color: "var(--input-color)", background: "var(--input-bg)", outline: "none", cursor: "pointer" }}
            >
              <option value="itemName_asc">Name A→Z</option>
              <option value="itemName_desc">Name Z→A</option>
              <option value="category_asc">Category A→Z</option>
              <option value="quantity_asc">Qty Low→High</option>
              <option value="quantity_desc">Qty High→Low</option>
              <option value="expirationDate_asc">Expiry Soonest</option>
              <option value="expirationDate_desc">Expiry Latest</option>
            </select>
          )}
        </div>

        {/* ── MOBILE: Card list ── */}
        {isMobile ? (
          <div>
            {groupedRows.length > 0 ? (
              groupedRows.map(({ key, name, items, isGroup }) =>
                isGroup ? (
                  <MobileGroupedCard key={key} name={name} items={items} categories={categories || []} sessionEmail={session?.user?.email}
                    unitSystem={unitSystem} onEdit={setEditingItem} isExpanded={expandedGroups.has(key)} onToggle={() => toggleGroup(key)} />
                ) : (
                  <MobileItemCard key={items[0].id} item={items[0]} categoryName={items[0].categoryName} categoryColor={items[0].categoryColor}
                    categories={categories || []} sessionEmail={session?.user?.email} unitSystem={unitSystem} onEdit={setEditingItem} />
                )
              )
            ) : (
              <div style={{ background: "var(--card-bg)", borderRadius: "14px", padding: "40px 24px", textAlign: "center", border: "1px solid var(--card-border)", color: "var(--text-secondary)", fontSize: "14px" }}>
                {allItems.length === 0 ? "Your pantry is empty — add your first item!" : "No items match your search."}
              </div>
            )}

            {filteredSorted.length > 0 && (
              <div style={{ marginTop: "8px", padding: "12px 16px", background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--card-border)", display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                <span>{filteredSorted.length} item{filteredSorted.length !== 1 ? "s" : ""}</span>
                <span style={{ color: "var(--alert-soon-text)" }}>{lowStockCount} low stock</span>
                <span style={{ color: "var(--alert-expired-text)" }}>{expiringSoonCount} expiring soon</span>
              </div>
            )}
          </div>
        ) : (
          /* ── DESKTOP: Table ── */
          <div style={{ background: "var(--card-bg)", borderRadius: "14px", border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "820px" }}>
                <thead>
                  <tr>
                    <th style={thStyle("itemName")} onClick={() => handleSort("itemName")}>Name <SortIcon field="itemName" sortField={sortField} sortDir={sortDir} /></th>
                    <th style={thStyle("category")} onClick={() => handleSort("category")}>Category <SortIcon field="category" sortField={sortField} sortDir={sortDir} /></th>
                    <th style={thStyle("quantity")} onClick={() => handleSort("quantity")}>Quantity <SortIcon field="quantity" sortField={sortField} sortDir={sortDir} /></th>
                    <th style={thStyle("unitLabel")} onClick={() => handleSort("unitLabel")}>Unit <SortIcon field="unitLabel" sortField={sortField} sortDir={sortDir} /></th>
                    <th style={{ ...thStyle("lowThreshold"), textAlign: "center" }} onClick={() => handleSort("lowThreshold")}>Threshold <SortIcon field="lowThreshold" sortField={sortField} sortDir={sortDir} /></th>
                    <th style={thStyle("expirationDate")} onClick={() => handleSort("expirationDate")}>Expiration Date <SortIcon field="expirationDate" sortField={sortField} sortDir={sortDir} /></th>
                    <th style={{ ...thStyle("notes"), cursor: "default" }}>Notes</th>
                    <th style={{ ...thStyle("itemName" as SortField), cursor: "default", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRows.length > 0 ? (
                    groupedRows.map(({ key, name, items, isGroup }) =>
                      isGroup ? (
                        <GroupedRow key={key} name={name} items={items} categories={categories || []} sessionEmail={session?.user?.email}
                          unitSystem={unitSystem} onEdit={setEditingItem} isExpanded={expandedGroups.has(key)} onToggle={() => toggleGroup(key)} />
                      ) : (
                        <PantryRow key={items[0].id} item={items[0]} categoryName={items[0].categoryName} categoryColor={items[0].categoryColor}
                          categories={categories || []} sessionEmail={session?.user?.email} unitSystem={unitSystem} onEdit={setEditingItem} />
                      )
                    )
                  ) : (
                    <tr><td colSpan={8} style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
                      {allItems.length === 0 ? "Your pantry is empty — add your first item!" : "No items match your search."}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredSorted.length > 0 && (
              <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "var(--surface-subtle)", display: "flex", gap: "20px", fontSize: "12px", color: "var(--text-secondary)" }}>
                <span>{filteredSorted.length} item{filteredSorted.length !== 1 ? "s" : ""}</span>
                <span>·</span>
                <span style={{ color: "var(--alert-soon-text)" }}>{lowStockCount} low stock</span>
                <span>·</span>
                <span style={{ color: "var(--alert-expired-text)" }}>{expiringSoonCount} expiring soon</span>
              </div>
            )}
          </div>
        )}
      </div>

      {editingItem && (
        <EditItemModal item={editingItem} categories={categories || []} unitSystem={unitSystem}
          onClose={() => setEditingItem(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["pantry", session?.user?.email] })}
        />
      )}

      {showBulkAdd && (
        <BulkAddModal categories={categories || []} onClose={() => setShowBulkAdd(false)}
          onImported={(count) => {
            queryClient.invalidateQueries({ queryKey: ["pantry", session?.user?.email] });
            setShowBulkAdd(false);
            setBulkToast(`${count} item${count !== 1 ? "s" : ""} added to your pantry!`);
            setTimeout(() => setBulkToast(null), 4000);
          }}
        />
      )}

      {bulkToast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: "var(--foreground)", color: "var(--card-bg)", padding: "13px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: 300, whiteSpace: "nowrap", animation: "toastSlideUp 0.2s ease" }}>
          🎉 {bulkToast}
        </div>
      )}

      <style>{`
        @keyframes toastSlideUp { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </AppShell>
  );
}
