"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import AppShell from "@/components/AppShell";

// ─── Preset palette ───────────────────────────────────────────────────────────

const PALETTE = [
  "#4A6FA5", // Steel Blue
  "#6B9FD4", // Sky Blue
  "#276749", // Forest Green
  "#68B98A", // Sage Green
  "#A0724A", // Wood Brown
  "#C49A6C", // Warm Tan
  "#9B59B6", // Purple
  "#E67E22", // Orange
  "#E74C3C", // Red
  "#E91E8C", // Pink
  "#16A085", // Teal
  "#F39C12", // Amber
  "#7F8C8D", // Slate
  "#2D3748", // Dark Slate
];

// ─── Color Swatch Picker ──────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: c, border: "none", cursor: "pointer",
              outline: value === c ? `3px solid ${c}` : "none",
              outlineOffset: "2px",
              boxShadow: value === c
                ? `0 0 0 2px #fff, 0 0 0 4px ${c}`
                : "0 1px 3px rgba(0,0,0,0.2)",
              transform: value === c ? "scale(1.15)" : "scale(1)",
              transition: "all 0.12s",
            }}
          />
        ))}
        {/* Custom hex input */}
        <label title="Custom color" style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <input
            type="color"
            value={value || "#4A6FA5"}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: "2px dashed #A0AEC0", cursor: "pointer",
              padding: "2px", background: "transparent", outline: "none",
            }}
            title="Pick custom color"
          />
        </label>
      </div>
      {value && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: value, border: "1px solid rgba(0,0,0,0.1)" }} />
          <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#4A5568" }}>{value}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            style={{ fontSize: "11px", color: "#A0AEC0", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Category color dot ───────────────────────────────────────────────────────

function CategoryDot({ color }: { color?: string | null }) {
  return (
    <div style={{
      width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0,
      background: color || "#A0AEC0",
      border: "2px solid rgba(0,0,0,0.08)",
    }} />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { data: session, status } = useSession({ required: true });
  const queryClient = useQueryClient();

  const [newName, setNewName]   = useState("");
  const [newColor, setNewColor] = useState("#4A6FA5");
  const [error, setError]       = useState("");

  // Editing state
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editName, setEditName]       = useState("");
  const [editColor, setEditColor]     = useState("");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null); // id of open picker

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", session?.user?.email],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  const createMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { setError(data.error); return; }
      setNewName("");
      setNewColor("#4A6FA5");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, color }: { id: string; name: string; color: string }) =>
      fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      }).then((r) => r.json()),
    onSuccess: () => {
      setEditingId(null);
      setShowColorPicker(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color || "#4A6FA5");
    setShowColorPicker(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowColorPicker(null);
  };

  if (status === "loading" || isLoading) {
    return <AppShell><div style={{ padding: "48px", textAlign: "center", color: "#4A5568" }}>Loading categories...</div></AppShell>;
  }

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px", border: "1px solid #E2E8F0",
    borderRadius: "10px", fontSize: "14px", color: "#2D3748",
    outline: "none", background: "#fff",
  };

  return (
    <AppShell>
      <div style={{ padding: "40px 48px", maxWidth: "700px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#2D3748", margin: 0 }}>Categories</h1>
          <p style={{ color: "#4A5568", marginTop: "6px", fontSize: "15px" }}>
            Organize your pantry into shelves and categories. Assign a color to each for easy identification.
          </p>
        </div>

        {/* ── Create new ── */}
        <div style={{
          background: "#fff", borderRadius: "14px", padding: "24px",
          border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          marginBottom: "24px",
        }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#2D3748", margin: "0 0 16px" }}>
            Add New Category
          </h2>

          <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
            {/* Color dot preview */}
            <div style={{
              width: "42px", height: "42px", borderRadius: "10px",
              background: newColor || "#A0AEC0",
              border: "2px solid rgba(0,0,0,0.08)", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }} />
            <input
              placeholder="e.g. Dairy, Spices, Snacks"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim())
                  createMutation.mutate({ name: newName.trim(), color: newColor });
              }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => newName.trim() && createMutation.mutate({ name: newName.trim(), color: newColor })}
              disabled={!newName.trim() || createMutation.isPending}
              style={{
                padding: "10px 20px", borderRadius: "10px",
                background: "#4A6FA5", color: "#fff", fontWeight: 600,
                fontSize: "14px", border: "none", cursor: "pointer",
                opacity: !newName.trim() ? 0.5 : 1, whiteSpace: "nowrap",
              }}
            >
              {createMutation.isPending ? "Adding..." : "+ Add"}
            </button>
          </div>

          {/* Color picker for new category */}
          <div style={{ paddingLeft: "52px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
              Category Color
            </p>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "10px" }}>{error}</p>}
        </div>

        {/* ── List ── */}
        <div style={{
          background: "#fff", borderRadius: "14px", padding: "24px",
          border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#2D3748", margin: "0 0 16px" }}>
            Your Categories ({categories?.length || 0})
          </h2>

          {categories?.length === 0 && (
            <p style={{ color: "#A0AEC0", fontSize: "14px", fontStyle: "italic" }}>
              No categories yet. Add one above!
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {categories?.map((cat: any) => (
              <div key={cat.id}>
                {/* Row */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: editingId === cat.id ? "10px 10px 0 0" : "10px",
                  background: editingId === cat.id ? "#EBF4FF" : "#F7FAFC",
                  border: `1px solid ${editingId === cat.id ? "#BED3F3" : "#E2E8F0"}`,
                  borderBottom: editingId === cat.id ? "none" : undefined,
                  transition: "all 0.15s",
                }}>
                  {editingId === cat.id ? (
                    /* ── Edit mode ── */
                    <div style={{ display: "flex", gap: "8px", flex: 1, marginRight: "12px", alignItems: "center" }}>
                      {/* Color preview */}
                      <button
                        type="button"
                        title="Change color"
                        onClick={() => setShowColorPicker(showColorPicker === cat.id ? null : cat.id)}
                        style={{
                          width: "32px", height: "32px", borderRadius: "8px",
                          background: editColor || "#A0AEC0",
                          border: "2px solid rgba(0,0,0,0.1)", cursor: "pointer",
                          flexShrink: 0, position: "relative",
                        }}
                      />
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateMutation.mutate({ id: cat.id, name: editName, color: editColor });
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        onClick={() => updateMutation.mutate({ id: cat.id, name: editName, color: editColor })}
                        style={{
                          padding: "8px 16px", background: "#4A6FA5", color: "#fff",
                          border: "none", borderRadius: "8px", cursor: "pointer",
                          fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: "8px 14px", background: "#F7FAFC", color: "#4A5568",
                          border: "1px solid #E2E8F0", borderRadius: "8px", cursor: "pointer", fontSize: "13px",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    /* ── View mode ── */
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* Color swatch */}
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "8px",
                          background: cat.color || "#A0AEC0",
                          border: "2px solid rgba(0,0,0,0.08)", flexShrink: 0,
                        }} />
                        <div>
                          <span style={{ fontWeight: 600, fontSize: "14px", color: "#2D3748" }}>{cat.name}</span>
                          {cat.color && (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                              <CategoryDot color={cat.color} />
                              <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#A0AEC0" }}>{cat.color}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => startEdit(cat)}
                          style={{
                            padding: "6px 14px", background: "#EBF4FF", color: "#4A6FA5",
                            border: "1px solid #BED3F3", borderRadius: "8px",
                            cursor: "pointer", fontSize: "13px", fontWeight: 500,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${cat.name}"? Items in this category will become uncategorized.`))
                              deleteMutation.mutate(cat.id);
                          }}
                          style={{
                            padding: "6px 14px", background: "#fef2f2", color: "#dc2626",
                            border: "1px solid #fecaca", borderRadius: "8px",
                            cursor: "pointer", fontSize: "13px", fontWeight: 500,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Inline color picker panel (edit mode) */}
                {editingId === cat.id && showColorPicker === cat.id && (
                  <div style={{
                    padding: "16px 18px",
                    background: "#EBF4FF",
                    border: "1px solid #BED3F3",
                    borderTop: "none",
                    borderRadius: "0 0 10px 10px",
                  }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>
                      Category Color
                    </p>
                    <ColorPicker value={editColor} onChange={setEditColor} />
                  </div>
                )}
                {/* Bottom rounding when edit panel is closed */}
                {editingId === cat.id && showColorPicker !== cat.id && (
                  <div style={{
                    height: "8px", background: "#EBF4FF",
                    border: "1px solid #BED3F3", borderTop: "none",
                    borderRadius: "0 0 10px 10px",
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
