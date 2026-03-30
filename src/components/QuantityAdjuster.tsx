"use client";

import { adjustQuantity } from "@/app/actions/pantry";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";

export default function QuantityPicker({ itemId, currentQty }: { itemId: string, currentQty: number }) {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(String(currentQty));
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleAdjust = async (amount: number) => {
    setLoading(true);
    const result = await adjustQuantity(itemId, amount);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["pantry"] });
      setInputValue(String(Math.max(0, currentQty + amount)));
    }
    setLoading(false);
  };

  const commitValue = async (raw: string) => {
    const parsed = parseFloat(raw);
    const newQty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setInputValue(String(newQty));
    setIsEditing(false);
    if (newQty === currentQty) return;
    setLoading(true);
    await fetch(`/api/pantry/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    });
    queryClient.invalidateQueries({ queryKey: ["pantry"] });
    setLoading(false);
  };

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: "var(--surface-subtle)", borderRadius: "8px", padding: "3px",
      border: "1px solid var(--border)",
    }}>
      {/* Minus */}
      <button
        onClick={() => handleAdjust(-1)}
        disabled={loading || currentQty <= 0}
        style={{
          width: "24px", height: "24px", borderRadius: "5px", border: "none",
          background: "var(--card-bg)", cursor: currentQty <= 0 ? "not-allowed" : "pointer",
          color: "var(--alert-expired-text)", fontWeight: 700, fontSize: "16px", lineHeight: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          opacity: (loading || currentQty <= 0) ? 0.4 : 1,
          transition: "background 0.12s", flexShrink: 0,
        }}
        onMouseEnter={(e) => { if (currentQty > 0 && !loading) (e.currentTarget as HTMLElement).style.background = "var(--alert-expired-bg)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--card-bg)"; }}
      >−</button>

      {/* Editable quantity input */}
      <input
        ref={inputRef}
        type="number" min="0" step="0.1"
        value={isEditing ? inputValue : String(currentQty)}
        disabled={loading}
        onFocus={() => { setIsEditing(true); setInputValue(String(currentQty)); setTimeout(() => inputRef.current?.select(), 0); }}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={(e) => commitValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") { setInputValue(String(currentQty)); setIsEditing(false); (e.target as HTMLInputElement).blur(); }
        }}
        style={{
          width: "48px", height: "24px", textAlign: "center",
          fontSize: "13px", fontWeight: 700, color: "var(--foreground)",
          border: isEditing ? "1px solid var(--brand)" : "1px solid transparent",
          borderRadius: "5px",
          background: isEditing ? "var(--input-bg)" : "transparent",
          outline: "none", cursor: "text", padding: "0 2px",
          transition: "border-color 0.12s, background 0.12s",
          MozAppearance: "textfield",
        } as React.CSSProperties}
      />

      {/* Plus */}
      <button
        onClick={() => handleAdjust(1)}
        disabled={loading}
        style={{
          width: "24px", height: "24px", borderRadius: "5px", border: "none",
          background: "var(--card-bg)", cursor: loading ? "not-allowed" : "pointer",
          color: "var(--brand)", fontWeight: 700, fontSize: "16px", lineHeight: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          opacity: loading ? 0.4 : 1, transition: "background 0.12s", flexShrink: 0,
        }}
        onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "var(--btn-edit-bg)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--card-bg)"; }}
      >+</button>

      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}
