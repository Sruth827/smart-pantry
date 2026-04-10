"use client";

import { useState, useActionState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query";
import { createPantryItem } from "@/app/actions/pantry";
import UnitDropdown from "./UnitDropdown";

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

export default function AddItemForm({
  categories,
  unitSystem = "Metric",
}: {
  categories: Category[];
  unitSystem?: "Imperial" | "Metric";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createPantryItem, null);
  const [unitLabel, setUnitLabel] = useState("");
  const queryClient = useQueryClient();

useEffect(() => {
  if (state?.success) {
    queryClient.invalidateQueries({ queryKey: ["pantry"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    setIsOpen(false);
    setUnitLabel("");
  }
}, [state, queryClient]);



  const inputCls: React.CSSProperties = {
    width: "100%", border: "1px solid var(--input-border)", borderRadius: "6px",
    padding: "8px 10px", fontSize: "14px", color: "var(--input-color)",
    background: "var(--input-bg)", outline: "none", boxSizing: "border-box",
  };

  const labelCls: React.CSSProperties = {
    display: "block", fontSize: "13px", fontWeight: 600,
    color: "var(--text-body)", marginBottom: "4px",
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: "10px 18px", borderRadius: "10px", background: "var(--brand)",
          color: "#fff", fontWeight: 600, fontSize: "14px", border: "none", cursor: "pointer",
        }}
      >
        + Add Item Manually
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="modal-center-wrap"
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-sheet"
            style={{
              background: "var(--card-bg)", borderRadius: "14px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              width: "100%", maxWidth: "440px", overflow: "hidden",
              border: "1px solid var(--card-border)",
              animation: "modalIn 0.18s ease",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "20px 24px 16px", borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--surface-subtle)",
            }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--foreground)" }}>New Pantry Item</h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1, padding: "2px 6px", borderRadius: "6px" }}
              >✕</button>
            </div>

            {/* Form Body */}
            <form action={formAction} style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelCls}>Item Name</label>
                <input name="itemName" required style={inputCls} placeholder="e.g. Whole Milk" />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={labelCls}>Shelf / Category</label>
                <select name="categoryId" style={{ ...inputCls, cursor: "pointer" }}>
                  <option value="">-- No Category --</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.color ? `● ${cat.name}` : cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div>
                  <label style={labelCls}>Quantity</label>
                  <input name="quantity" type="number" step="0.1" defaultValue="1" style={inputCls} />
                </div>
                <div>
                  <label style={labelCls}>Unit</label>
                  <input type="hidden" name="unitLabel" value={unitLabel} />
                  <UnitDropdown value={unitLabel} onChange={setUnitLabel} unitSystem={unitSystem} placeholder="Select unit…" inputStyle={{ fontSize: "14px", padding: "8px 10px", borderRadius: "6px" }} />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={labelCls}>Expiration Date</label>
                <input type="date" name="expirationDate" style={inputCls} />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={labelCls}>Notes <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>(optional)</span></label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g. Opened, store in fridge after opening…"
                  style={{ ...inputCls, resize: "vertical", minHeight: "60px", fontFamily: "inherit" }}
                />
              </div>

              {state?.error && <p style={{ color: "var(--alert-expired-text)", fontSize: "13px", fontStyle: "italic", marginBottom: "10px" }}>{state.error}</p>}

              <div style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
                <button
                  type="button" onClick={() => setIsOpen(false)}
                  style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "1px solid var(--btn-cancel-border)", background: "var(--btn-cancel-bg)", color: "var(--btn-cancel-color)", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}
                >Cancel</button>
                <button
                  type="submit" disabled={isPending}
                  style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "none", background: "var(--brand)", color: "#fff", fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1, fontSize: "14px" }}
                >{isPending ? "Saving..." : "Save Item"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
