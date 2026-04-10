"use client";

import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import AppShell from "@/components/AppShell";

type ViewMode = "alphabetical" | "category";
type PageTab = "list" | "history" | "add-to-pantry";

// ─── Quick Add Modal ───────────────────────────────────────────────────────────

function QuickAddModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, qty: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onAdd(name.trim(), qty.trim());
    setSaving(false);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid var(--input-border)", borderRadius: "8px",
    padding: "10px 12px", fontSize: "14px", color: "var(--input-color)",
    background: "var(--input-bg)", outline: "none", boxSizing: "border-box",
  };

  return (
    <div onClick={onClose} className="modal-center-wrap" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", padding: "16px" }}>
      <div onClick={(e) => e.stopPropagation()} className="modal-sheet" style={{ background: "var(--card-bg)", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", width: "100%", maxWidth: "400px", border: "1px solid var(--card-border)", animation: "modalIn 0.18s ease", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-subtle)" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--foreground)" }}>Add to Shopping List</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1, padding: "2px 6px", borderRadius: "6px" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "20px 22px" }}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-body)", marginBottom: "5px" }}>Item Name <span style={{ color: "var(--alert-expired-text)" }}>*</span></label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Whole Milk" required style={inputStyle} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-body)", marginBottom: "5px" }}>Quantity <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--text-secondary)" }}>(optional)</span></label>
            <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="e.g. 2 cartons, 500g" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--btn-cancel-border)", background: "var(--btn-cancel-bg)", color: "var(--btn-cancel-color)", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}>Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "none", background: "var(--brand)", color: "#fff", fontWeight: 700, cursor: saving || !name.trim() ? "not-allowed" : "pointer", opacity: saving || !name.trim() ? 0.6 : 1, fontSize: "14px" }}>{saving ? "Adding..." : "Add Item"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Item Modal ───────────────────────────────────────────────────────────

function EditItemModal({ item, categories, onClose, onSave }: { item: any; categories: any[]; onClose: () => void; onSave: (id: string, data: any) => Promise<void> }) {
  // quantity is stored as a combined string e.g. "2 kg" — split it back out
  const parsedQty = (() => {
    const raw = (item.quantity || "").trim();
    const match = raw.match(/^([\d.,]+)\s*(.*)$/);
    return match ? { qty: match[1], unit: match[2].trim() } : { qty: raw, unit: "" };
  })();
  const [itemName, setItemName] = useState(item.itemName || "");
  const [quantity, setQuantity] = useState(parsedQty.qty);
  const [categoryId, setCategoryId] = useState(item.categoryId || "");
  const [unitLabel, setUnitLabel] = useState(parsedQty.unit);
  const [notes, setNotes] = useState(item.sourceLabel || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    setSaving(true);
    await onSave(item.id, { itemName: itemName.trim(), quantity: quantity || null, categoryId: categoryId || null, unitLabel: unitLabel || null, notes: notes || null });
    setSaving(false);
    onClose();
  };

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid var(--input-border)", borderRadius: "8px", padding: "9px 12px", fontSize: "14px", color: "var(--input-color)", background: "var(--input-bg)", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-body)", marginBottom: "5px" };

  return (
    <div onClick={onClose} className="modal-center-wrap" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", padding: "16px" }}>
      <div onClick={(e) => e.stopPropagation()} className="modal-sheet" style={{ background: "var(--card-bg)", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", width: "100%", maxWidth: "460px", border: "1px solid var(--card-border)", animation: "modalIn 0.18s ease", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-subtle)", position: "sticky", top: 0, zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--foreground)" }}>Edit Item</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1, padding: "2px 6px", borderRadius: "6px" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "20px 22px" }}>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Item Name <span style={{ color: "var(--alert-expired-text)" }}>*</span></label>
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} required style={inputStyle} placeholder="e.g. Whole Milk" />
          </div>
          <div className="form-grid-2">
            <div>
              <label style={labelStyle}>Quantity</label>
              <input value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} placeholder="e.g. 2, 500g" />
            </div>
            <div>
              <label style={labelStyle}>Unit</label>
              <input value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} style={inputStyle} placeholder="e.g. kg, cans" />
            </div>
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">-- No Category --</option>
              {categories.map((cat: any) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Notes <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any notes about this item…" style={{ ...inputStyle, resize: "vertical", minHeight: "60px", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--btn-cancel-border)", background: "var(--btn-cancel-bg)", color: "var(--btn-cancel-color)", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}>Cancel</button>
            <button type="submit" disabled={saving || !itemName.trim()} style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "none", background: "var(--brand)", color: "#fff", fontWeight: 700, cursor: saving || !itemName.trim() ? "not-allowed" : "pointer", opacity: saving || !itemName.trim() ? 0.6 : 1, fontSize: "14px" }}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add to Pantry Modal ───────────────────────────────────────────────────────

function AddToPantryModal({ item, categories, onClose, onAdd }: { item: any; categories: any[]; onClose: () => void; onAdd: (data: any) => Promise<void> }) {
  const parsedQty2 = (() => {
    const raw = (item.quantity || "").trim();
    const match = raw.match(/^([\d.,]+)\s*(.*)$/);
    return match ? { qty: match[1], unit: match[2].trim() } : { qty: "", unit: raw };
  })();
  const [itemName, setItemName] = useState(item.itemName || "");
  const [quantity, setQuantity] = useState(parsedQty2.qty);
  const [unitLabel, setUnitLabel] = useState(parsedQty2.unit);
  const [categoryId, setCategoryId] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [lowThreshold, setLowThreshold] = useState("");
  const [notes, setNotes] = useState(item.sourceLabel || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    setSaving(true);
    await onAdd({ itemName: itemName.trim(), quantity: parseFloat(quantity) || 1, unitLabel: unitLabel || null, categoryId: categoryId || null, expirationDate: expirationDate || null, lowThreshold: parseFloat(lowThreshold) || 0, notes: notes || null });
    setSaving(false);
    onClose();
  };

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid var(--input-border)", borderRadius: "8px", padding: "9px 12px", fontSize: "14px", color: "var(--input-color)", background: "var(--input-bg)", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-body)", marginBottom: "5px" };

  return (
    <div onClick={onClose} className="modal-center-wrap" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", padding: "16px" }}>
      <div onClick={(e) => e.stopPropagation()} className="modal-sheet" style={{ background: "var(--card-bg)", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", width: "100%", maxWidth: "460px", border: "1px solid var(--card-border)", animation: "modalIn 0.18s ease", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, var(--brand) 0%, #2c7a4b 100%)", position: "sticky", top: 0, zIndex: 1 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#fff" }}>Add to Pantry</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>Filling in details for <strong>{item.itemName}</strong></p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", fontSize: "16px", cursor: "pointer", color: "#fff", lineHeight: 1, padding: "4px 8px", borderRadius: "6px" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "20px 22px" }}>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Item Name <span style={{ color: "var(--alert-expired-text)" }}>*</span></label>
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} required style={inputStyle} />
          </div>
          <div className="form-grid-2">
            <div>
              <label style={labelStyle}>Quantity</label>
              <input type="number" step="0.1" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Unit</label>
              <input value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} placeholder="e.g. kg, cans" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">-- No Category --</option>
              {categories.map((cat: any) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>
          <div className="form-grid-2">
            <div>
              <label style={labelStyle}>Expiration Date</label>
              <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Low Threshold</label>
              <input type="number" step="0.1" min="0" value={lowThreshold} onChange={(e) => setLowThreshold(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Notes <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. Store in fridge after opening…" style={{ ...inputStyle, resize: "vertical", minHeight: "60px", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--btn-cancel-border)", background: "var(--btn-cancel-bg)", color: "var(--btn-cancel-color)", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}>Cancel</button>
            <button type="submit" disabled={saving || !itemName.trim()} style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "none", background: "var(--brand)", color: "#fff", fontWeight: 700, cursor: saving || !itemName.trim() ? "not-allowed" : "pointer", opacity: saving || !itemName.trim() ? 0.6 : 1, fontSize: "14px" }}>{saving ? "Adding..." : "✓ Add to Pantry"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Single item row ──────────────────────────────────────────────────────────

function ShoppingItem({ item, isChecked, categoryColor, onToggle, onDelete, onEdit }: { item: any; isChecked: boolean; categoryColor?: string | null; onToggle: () => void; onDelete?: () => void; onEdit?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 20px", borderBottom: "1px solid var(--border)", opacity: isChecked ? 0.45 : 1, transition: "opacity 0.15s, background 0.15s", background: hovered && !isChecked ? "var(--surface-subtle)" : isChecked ? "var(--surface-subtle)" : "var(--card-bg)" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      <div onClick={onToggle} style={{ width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0, border: `2px solid ${isChecked ? "var(--brand)" : "var(--border)"}`, background: isChecked ? "var(--brand)" : "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", cursor: "pointer" }}>
        {isChecked && (<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
      </div>
      <div onClick={onToggle} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)", textDecoration: isChecked ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.itemName}</div>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {item._type === "manual" ? (
            <>
              <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: item.source === "recipe" ? "var(--accent-subtle, #F5EDE4)" : "var(--surface-subtle)", color: item.source === "recipe" ? "#A0724A" : "var(--text-secondary)", border: `1px solid ${item.source === "recipe" ? "var(--accent-border, #D4B49A)" : "var(--border)"}` }}>
                {item.source === "recipe" ? "🛒 From recipe" : "✏️ Manual"}
              </span>
              {item.quantity && (<><span style={{ color: "var(--border)" }}>·</span><span>{item.quantity}</span></>)}
              {item.sourceLabel && item.source !== "recipe" && (<><span style={{ color: "var(--border)" }}>·</span><span style={{ fontStyle: "italic" }}>{item.sourceLabel}</span></>)}
            </>
          ) : (
            <>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, background: categoryColor || "var(--text-secondary)", display: "inline-block" }} />
              <span>{item.categoryName}</span>
              <span style={{ color: "var(--border)" }}>·</span>
              {item._isGroup ? (
                <span>{item._groupCount} instances · {Number(item.quantity).toFixed(Number.isInteger(Number(item.quantity)) ? 0 : 1)} {item.unitLabel || "units"} total (min: {Number(item.lowThreshold)})</span>
              ) : (
                <span>Has {Number(item.quantity)} {item.unitLabel || "units"} (min: {Number(item.lowThreshold)})</span>
              )}
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
        {item._type === "manual" && onEdit && !isChecked && (
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit item" style={{ background: "none", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-secondary)", fontSize: "12px", padding: "3px 8px", borderRadius: "6px", lineHeight: 1, display: "flex", alignItems: "center", gap: "3px", transition: "all 0.15s", opacity: hovered ? 1 : 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Edit
          </button>
        )}
        {item._type === "manual" ? (
          onDelete && (<button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "16px", padding: "2px 6px", borderRadius: "6px", flexShrink: 0, lineHeight: 1 }} title="Remove">✕</button>)
        ) : (
          !isChecked && (<span style={{ padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "var(--alert-soon-bg)", color: "var(--alert-soon-text)", border: "1px solid var(--alert-soon-border)", whiteSpace: "nowrap" }}>LOW</span>)
        )}
      </div>
    </div>
  );
}

// ─── Add to Pantry Tab ────────────────────────────────────────────────────────

function AddToPantryTab({
  allItems,
  categories,
  onAddToPantry,
  onBulkAddToPantry,
}: {
  allItems: any[];
  categories: any[];
  onAddToPantry: (item: any) => void;
  onBulkAddToPantry: (items: any[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [bulkAdding, setBulkAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allItems.filter((i) => !added.has(i.id) && (!q || i.itemName.toLowerCase().includes(q)));
  }, [allItems, search, added]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));
  const someSelected = selected.size > 0;

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered items
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      // Select all filtered items
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  const handleBulkAdd = async () => {
    const itemsToAdd = filtered.filter((i) => selected.has(i.id));
    if (itemsToAdd.length === 0) return;
    setBulkAdding(true);
    await onBulkAddToPantry(itemsToAdd);
    setAdded((prev) => {
      const next = new Set(prev);
      itemsToAdd.forEach((i) => next.add(i.id));
      return next;
    });
    setSelected((prev) => {
      const next = new Set(prev);
      itemsToAdd.forEach((i) => next.delete(i.id));
      return next;
    });
    setBulkAdding(false);
  };

  const handleSingleAdd = (item: any) => {
    onAddToPantry(item);
  };

  const cbStyle = (active: boolean): React.CSSProperties => ({
    width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0, cursor: "pointer",
    border: `2px solid ${active ? "var(--brand)" : "var(--border)"}`,
    background: active ? "var(--brand)" : "var(--card-bg)",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
  });

  return (
    <div style={{ paddingBottom: someSelected ? "80px" : "0", transition: "padding-bottom 0.2s" }}>
      {/* Search bar */}
      <div style={{ marginBottom: "16px", position: "relative" }}>
        <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", pointerEvents: "none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          style={{ width: "100%", border: "1px solid var(--input-border)", borderRadius: "10px", padding: "10px 12px 10px 36px", fontSize: "14px", color: "var(--input-color)", background: "var(--input-bg)", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {filtered.length === 0 && added.size === 0 ? (
        <div style={{ background: "var(--card-bg)", borderRadius: "14px", border: "1px solid var(--border)", padding: "40px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
          {search ? `No items matching "${search}"` : "Your shopping list is empty."}
        </div>
      ) : filtered.length === 0 && added.size > 0 ? (
        <div style={{ background: "var(--card-bg)", borderRadius: "14px", border: "1px solid var(--border)", padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>🏠</div>
          <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--foreground)", margin: "0 0 4px" }}>All done!</p>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>{added.size} item{added.size !== 1 ? "s" : ""} added to your pantry.</p>
        </div>
      ) : (
        <div style={{ background: "var(--card-bg)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {/* Table header */}
          <div style={{ padding: "12px 20px", background: "var(--surface-subtle)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Select-all checkbox */}
            <div onClick={toggleSelectAll} style={cbStyle(allFilteredSelected)}>
              {allFilteredSelected && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {!allFilteredSelected && someSelected && filtered.some((i) => selected.has(i.id)) && (
                <div style={{ width: "8px", height: "2px", background: "var(--brand)", borderRadius: "2px" }} />
              )}
            </div>
            <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.05em", flex: 1 }}>
              {someSelected ? `${selected.size} selected` : `${filtered.length} item${filtered.length !== 1 ? "s" : ""}`}
            </span>
            {added.size > 0 && (
              <span style={{ fontSize: "12px", color: "var(--brand)", fontWeight: 600 }}>
                {added.size} added ✓
              </span>
            )}
          </div>

          {/* Item rows */}
          {filtered.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 20px", borderBottom: "1px solid var(--border)", background: isSelected ? "color-mix(in srgb, var(--brand) 6%, var(--card-bg))" : "var(--card-bg)", cursor: "pointer", transition: "background 0.12s", userSelect: "none" }}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--surface-subtle)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isSelected ? "color-mix(in srgb, var(--brand) 6%, var(--card-bg))" : "var(--card-bg)"; }}
              >
                {/* Checkbox */}
                <div style={cbStyle(isSelected)}>
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.itemName}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px", display: "flex", alignItems: "center", gap: "5px" }}>
                    {item._type === "manual" ? (
                      <>
                        <span style={{ padding: "1px 6px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "var(--surface-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>✏️ Manual</span>
                        {item.quantity && <><span style={{ color: "var(--border)" }}>·</span><span>{item.quantity}</span></>}
                      </>
                    ) : (
                      <>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--text-secondary)", display: "inline-block", flexShrink: 0 }} />
                        <span>{item.categoryName}</span>
                        {item.quantity !== undefined && <><span style={{ color: "var(--border)" }}>·</span><span>Qty: {Number(item.quantity).toFixed(Number.isInteger(Number(item.quantity)) ? 0 : 1)} {item.unitLabel || ""}</span></>}
                      </>
                    )}
                  </div>
                </div>

                {/* Individual "add with details" link */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleSingleAdd(item); }}
                  title="Add with full details"
                  style={{ background: "none", border: "1px solid var(--border)", borderRadius: "7px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600, padding: "4px 10px", flexShrink: 0, whiteSpace: "nowrap", transition: "all 0.15s" }}
                >
                  + Details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky bulk-add bar */}
      {someSelected && (
        <div style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          background: "var(--foreground)", borderRadius: "14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
          display: "flex", alignItems: "center", gap: "16px",
          padding: "12px 20px", zIndex: 60,
          animation: "toastIn 0.2s ease",
          minWidth: "min(320px, calc(100vw - 32px))", maxWidth: "560px",
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: "var(--card-bg)", fontWeight: 700, fontSize: "14px" }}>
              {selected.size} item{selected.size !== 1 ? "s" : ""} selected
            </span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginLeft: "8px" }}>
              ready to add
            </span>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "8px", color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: 500, padding: "7px 12px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleBulkAdd}
            disabled={bulkAdding}
            style={{ background: "var(--brand)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, padding: "8px 18px", cursor: bulkAdding ? "not-allowed" : "pointer", opacity: bulkAdding ? 0.7 : 1, display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
          >
            {bulkAdding ? (
              "Adding…"
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Add {selected.size} to Pantry
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShoppingPage() {
  const { data: session, status } = useSession({ required: true });
  const queryClient = useQueryClient();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewMode>("alphabetical");
  const [tab, setTab] = useState<PageTab>("list");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [addToPantryItem, setAddToPantryItem] = useState<any | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data: pantryData, isLoading: pantryLoading } = useQuery({
    queryKey: ["pantry", session?.user?.email],
    queryFn: () => fetch("/api/pantry").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", session?.user?.email],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  const { data: shoppingListData, isLoading: listLoading } = useQuery({
    queryKey: ["shopping-list", session?.user?.email],
    queryFn: () => fetch("/api/shopping-list").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  const colorMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(categoriesData)) categoriesData.forEach((cat: any) => { if (cat.color) map[cat.name] = cat.color; });
    return map;
  }, [categoriesData]);

  const categories = useMemo<any[]>(() => Array.isArray(categoriesData) ? categoriesData : [], [categoriesData]);

  const autoItems = useMemo<any[]>(() => {
    const result: any[] = [];
    if (!Array.isArray(pantryData)) return result;
    const flat: any[] = [];
    pantryData.forEach((cat: any) => { (cat.items || []).forEach((item: any) => { flat.push({ ...item, categoryName: cat.name ?? "Uncategorized" }); }); });
    const byName = new Map<string, any[]>();
    flat.forEach((item) => { const key = item.itemName.toLowerCase().trim(); if (!byName.has(key)) byName.set(key, []); byName.get(key)!.push(item); });
    byName.forEach((group) => {
      const threshold = Number(group.find((i) => Number(i.lowThreshold) > 0)?.lowThreshold ?? 0);
      if (threshold <= 0) return;
      if (group.length === 1) { const item = group[0]; if (Number(item.quantity) <= threshold) result.push({ ...item, _type: "auto" }); }
      else { const totalQty = group.reduce((s, i) => s + Number(i.quantity), 0); if (totalQty <= threshold) { const rep = group[0]; result.push({ ...rep, quantity: totalQty, lowThreshold: threshold, _groupCount: group.length, _isGroup: true, _type: "auto" }); } }
    });
    return result;
  }, [pantryData]);

  const manualItems = useMemo<any[]>(() => Array.isArray(shoppingListData) ? shoppingListData.map((i: any) => ({ ...i, _type: "manual" })) : [], [shoppingListData]);
  const allItems = useMemo(() => [...manualItems, ...autoItems], [manualItems, autoItems]);
  const unchecked = useMemo(() => allItems.filter((i) => !checked.has(i.id)), [allItems, checked]);
  const checkedItems = useMemo(() => allItems.filter((i) => checked.has(i.id)), [allItems, checked]);
  const alphaSorted = useMemo(() => [...unchecked].sort((a, b) => a.itemName.localeCompare(b.itemName)), [unchecked]);
  const byCategory = useMemo(() => {
    const map: Record<string, any[]> = {};
    unchecked.forEach((item) => { const key = item._type === "manual" ? "✏️ Added Manually" : (item.categoryName || "Uncategorized"); if (!map[key]) map[key] = []; map[key].push(item); });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.itemName.localeCompare(b.itemName)));
    return Object.entries(map).sort(([a], [b]) => { if (a === "Uncategorized") return 1; if (b === "Uncategorized") return -1; return a.localeCompare(b); });
  }, [unchecked]);

  if (status === "loading" || pantryLoading || listLoading) {
    return (<AppShell><div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-body)" }}>Loading shopping list...</div></AppShell>);
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const toggleCheck = (id: string) => { setChecked((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };
  const deleteManualItem = async (id: string) => { await fetch(`/api/shopping-list?id=${id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: ["shopping-list"] }); };
  const clearCheckedManual = async () => {
    const checkedManual = manualItems.filter((i) => checked.has(i.id));
    await Promise.all(checkedManual.map((i) => fetch(`/api/shopping-list?id=${i.id}`, { method: "DELETE" })));
    queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    setChecked(new Set());
  };
  const addManualItem = async (name: string, qty: string) => {
    await fetch("/api/shopping-list", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemName: name, quantity: qty || null }) });
    queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    showToast(`"${name}" added to your list`);
  };
  const editItem = async (id: string, data: any) => {
    await fetch("/api/shopping-list", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    showToast("Item updated");
  };
  const addToPantry = async (data: any) => {
    await fetch("/api/pantry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    queryClient.invalidateQueries({ queryKey: ["pantry"] });
    showToast(`"${data.itemName}" added to pantry!`);
  };
  const bulkAddToPantry = async (items: any[]) => {
    await Promise.all(items.map((item) =>
      fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: item.itemName,
          quantity: item._type === "auto" ? Number(item.quantity) : (parseFloat(item.quantity) || 1),
          unitLabel: item.unitLabel || null,
          categoryId: item.categoryId || null,
          notes: item.sourceLabel || null,
        }),
      })
    ));
    queryClient.invalidateQueries({ queryKey: ["pantry"] });
    showToast(`${items.length} item${items.length !== 1 ? "s" : ""} added to pantry!`);
  };

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({ padding: "9px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: active ? 700 : 500, border: "none", cursor: "pointer", transition: "all 0.15s", background: active ? "var(--brand)" : "transparent", color: active ? "#fff" : "var(--text-body)", display: "flex", alignItems: "center", gap: "6px" });
  const viewBtnStyle = (active: boolean): React.CSSProperties => ({ padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: active ? 700 : 500, border: "none", cursor: "pointer", transition: "all 0.15s", background: active ? "var(--brand)" : "transparent", color: active ? "#fff" : "var(--text-body)" });

  return (
    <AppShell>
      <div className="shopping-container">
        {/* Header */}
        <div className="page-header-row" style={{ marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Shopping List</h1>
            <p style={{ color: "var(--text-body)", marginTop: "6px", fontSize: "15px", marginBottom: 0 }}>
              {allItems.length === 0 ? "All stocked up — nothing needs restocking." : `${allItems.length} item${allItems.length !== 1 ? "s" : ""} to pick up.`}
            </p>
          </div>
          <button onClick={() => setShowQuickAdd(true)} style={{ padding: "10px 18px", borderRadius: "10px", background: "var(--brand)", color: "#fff", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Add Item
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: "inline-flex", background: "var(--surface-subtle)", border: "1px solid var(--border)", borderRadius: "10px", padding: "4px", marginBottom: "20px", gap: "2px" }}>
          <button style={tabBtnStyle(tab === "list")} onClick={() => setTab("list")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            Shopping List
          </button>
          <button style={tabBtnStyle(tab === "history")} onClick={() => setTab("history")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            In Cart
            {checkedItems.length > 0 && (<span style={{ background: tab === "history" ? "rgba(255,255,255,0.3)" : "var(--brand)", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: 800 }}>{checkedItems.length}</span>)}
          </button>
          <button style={tabBtnStyle(tab === "add-to-pantry")} onClick={() => setTab("add-to-pantry")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            Add to Pantry
          </button>
        </div>

        {/* Shopping List Tab */}
        {tab === "list" && (
          <>
            {allItems.length === 0 ? (
              <div style={{ background: "var(--card-bg)", borderRadius: "16px", padding: "40px 24px", textAlign: "center", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: "52px", marginBottom: "16px" }}>🛒</div>
                <h2 style={{ color: "var(--foreground)", fontWeight: 700, margin: "0 0 8px" }}>All stocked up!</h2>
                <p style={{ color: "var(--text-secondary)", margin: "0 0 20px" }}>No items are currently below their restock threshold.</p>
                <button onClick={() => setShowQuickAdd(true)} style={{ padding: "10px 20px", borderRadius: "10px", background: "var(--brand)", color: "#fff", fontWeight: 600, fontSize: "14px", border: "none", cursor: "pointer" }}>+ Add item manually</button>
              </div>
            ) : (
              <>
                <div style={{ display: "inline-flex", background: "var(--surface-subtle)", border: "1px solid var(--border)", borderRadius: "10px", padding: "4px", marginBottom: "20px", gap: "2px" }}>
                  <button style={viewBtnStyle(view === "alphabetical")} onClick={() => setView("alphabetical")}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h10M4 18h6" /></svg>A–Z</span>
                  </button>
                  <button style={viewBtnStyle(view === "category")} onClick={() => setView("category")}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>By Category</span>
                  </button>
                </div>

                {unchecked.length > 0 ? (
                  <div style={{ background: "var(--card-bg)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ padding: "13px 20px", background: "var(--surface-subtle)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Need to buy — {unchecked.length}</span>
                      {checked.size > 0 && (<button onClick={clearCheckedManual} style={{ fontSize: "12px", color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear all checks</button>)}
                    </div>
                    {view === "alphabetical" && alphaSorted.map((item) => (<ShoppingItem key={item.id} item={item} isChecked={false} categoryColor={colorMap[item.categoryName]} onToggle={() => toggleCheck(item.id)} onDelete={item._type === "manual" ? () => deleteManualItem(item.id) : undefined} onEdit={item._type === "manual" ? () => setEditingItem(item) : undefined} />))}
                    {view === "category" && byCategory.map(([catName, items]) => (
                      <div key={catName}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 20px", background: colorMap[catName] ? `${colorMap[catName]}18` : "var(--btn-edit-bg)", borderBottom: "1px solid var(--border)", borderTop: "1px solid var(--border)" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "3px", flexShrink: 0, background: colorMap[catName] || "var(--text-secondary)" }} />
                          <span style={{ fontSize: "11px", fontWeight: 800, color: colorMap[catName] || "var(--text-body)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{catName}</span>
                          <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 600, color: colorMap[catName] || "var(--text-secondary)", background: "var(--card-bg)", padding: "1px 8px", borderRadius: "10px", border: `1px solid ${colorMap[catName] ? `${colorMap[catName]}44` : "var(--border)"}` }}>{items.length}</span>
                        </div>
                        {items.map((item) => (<ShoppingItem key={item.id} item={item} isChecked={false} categoryColor={colorMap[item.categoryName]} onToggle={() => toggleCheck(item.id)} onDelete={item._type === "manual" ? () => deleteManualItem(item.id) : undefined} onEdit={item._type === "manual" ? () => setEditingItem(item) : undefined} />))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: "var(--card-bg)", borderRadius: "14px", border: "1px solid var(--border)", padding: "32px", textAlign: "center", marginBottom: "16px", color: "var(--text-secondary)", fontSize: "14px" }}>
                    ✅ All items checked off! Head to the <strong>In Cart</strong> tab to review.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* In Cart Tab */}
        {tab === "history" && (
          <>
            {checkedItems.length === 0 ? (
              <div style={{ background: "var(--card-bg)", borderRadius: "14px", border: "1px solid var(--border)", padding: "40px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
                No items checked off yet. Check items off in the Shopping List tab as you pick them up.
              </div>
            ) : (
              <div style={{ background: "var(--surface-subtle)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-body)", textTransform: "uppercase", letterSpacing: "0.05em" }}>In cart — {checkedItems.length}</span>
                  <button onClick={clearCheckedManual} style={{ fontSize: "12px", color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear checked</button>
                </div>
                {[...checkedItems].sort((a, b) => a.itemName.localeCompare(b.itemName)).map((item) => (<ShoppingItem key={item.id} item={item} isChecked={true} categoryColor={colorMap[item.categoryName]} onToggle={() => toggleCheck(item.id)} onDelete={item._type === "manual" ? () => deleteManualItem(item.id) : undefined} />))}
              </div>
            )}
          </>
        )}

        {/* Add to Pantry Tab */}
        {tab === "add-to-pantry" && (
          <AddToPantryTab allItems={allItems} categories={categories} onAddToPantry={(item) => setAddToPantryItem(item)} onBulkAddToPantry={bulkAddToPantry} />
        )}
      </div>

      {showQuickAdd && (<QuickAddModal onClose={() => setShowQuickAdd(false)} onAdd={addManualItem} />)}
      {editingItem && (<EditItemModal item={editingItem} categories={categories} onClose={() => setEditingItem(null)} onSave={editItem} />)}
      {addToPantryItem && (<AddToPantryModal item={addToPantryItem} categories={categories} onClose={() => setAddToPantryItem(null)} onAdd={addToPantry} />)}

      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: "var(--foreground)", color: "var(--card-bg)", padding: "12px 22px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: 100, animation: "toastIn 0.2s ease", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </AppShell>
  );
}
