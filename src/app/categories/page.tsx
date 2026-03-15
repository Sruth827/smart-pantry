"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import AppShell from "@/components/AppShell";

const PALETTE = [
  "#4A6FA5","#6B9FD4","#276749","#68B98A","#A0724A","#C49A6C",
  "#9B59B6","#E67E22","#E74C3C","#E91E8C","#16A085","#F39C12","#7F8C8D","#2D3748",
];

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
        {PALETTE.map((c) => (
          <button key={c} type="button" title={c} onClick={() => onChange(c)} style={{
            width: "28px", height: "28px", borderRadius: "50%", background: c, border: "none", cursor: "pointer",
            outline: value === c ? `3px solid ${c}` : "none", outlineOffset: "2px",
            boxShadow: value === c ? `0 0 0 2px var(--card-bg), 0 0 0 4px ${c}` : "0 1px 3px rgba(0,0,0,0.2)",
            transform: value === c ? "scale(1.15)" : "scale(1)", transition: "all 0.12s",
          }} />
        ))}
        <label title="Custom color" style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <input type="color" value={value || "#4A6FA5"} onChange={(e) => onChange(e.target.value)} style={{
            width: "28px", height: "28px", borderRadius: "50%",
            border: "2px dashed var(--text-secondary)", cursor: "pointer",
            padding: "2px", background: "transparent", outline: "none",
          }} title="Pick custom color" />
        </label>
      </div>
      {value && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: value, border: "1px solid rgba(0,0,0,0.1)" }} />
          <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-body)" }}>{value}</span>
          <button type="button" onClick={() => onChange("")} style={{ fontSize: "11px", color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Clear</button>
        </div>
      )}
    </div>
  );
}

function CategoryDot({ color }: { color?: string | null }) {
  return (
    <div style={{ width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0, background: color || "var(--text-secondary)", border: "2px solid rgba(0,0,0,0.08)" }} />
  );
}

export default function CategoriesPage() {
  const { data: session, status } = useSession({ required: true });
  const queryClient = useQueryClient();
  const [newName, setNewName]   = useState("");
  const [newColor, setNewColor] = useState("#4A6FA5");
  const [error, setError]       = useState("");
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editName, setEditName]       = useState("");
  const [editColor, setEditColor]     = useState("");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", session?.user?.email],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  const createMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, color }) }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { setError(data.error); return; }
      setNewName(""); setNewColor("#4A6FA5"); setError("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, color }: { id: string; name: string; color: string }) =>
      fetch(`/api/categories/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, color }) }).then((r) => r.json()),
    onSuccess: () => { setEditingId(null); setShowColorPicker(null); queryClient.invalidateQueries({ queryKey: ["categories"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const startEdit = (cat: any) => { setEditingId(cat.id); setEditName(cat.name); setEditColor(cat.color || "#4A6FA5"); setShowColorPicker(null); };
  const cancelEdit = () => { setEditingId(null); setShowColorPicker(null); };

  if (status === "loading" || isLoading) {
    return <AppShell><div style={{ padding: "48px", textAlign: "center", color: "var(--text-body)" }}>Loading categories...</div></AppShell>;
  }

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px", border: "1px solid var(--input-border)",
    borderRadius: "10px", fontSize: "14px", color: "var(--input-color)",
    outline: "none", background: "var(--input-bg)",
  };

  return (
    <AppShell>
      <div style={{ padding: "40px 48px", maxWidth: "700px" }}>

        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Categories</h1>
          <p style={{ color: "var(--text-body)", marginTop: "6px", fontSize: "15px" }}>
            Organize your pantry into shelves and categories. Assign a color to each for easy identification.
          </p>
        </div>

        {/* ── Create new ── */}
        <div style={{
          background: "var(--card-bg)", borderRadius: "14px", padding: "24px",
          border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)", marginBottom: "24px",
        }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", margin: "0 0 16px" }}>
            Add New Category
          </h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "10px",
              background: newColor || "var(--text-secondary)",
              border: "2px solid rgba(0,0,0,0.08)", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }} />
            <input
              placeholder="e.g. Dairy, Spices, Snacks" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) createMutation.mutate({ name: newName.trim(), color: newColor }); }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => newName.trim() && createMutation.mutate({ name: newName.trim(), color: newColor })}
              disabled={!newName.trim() || createMutation.isPending}
              style={{
                padding: "10px 20px", borderRadius: "10px", background: "var(--brand)", color: "#fff",
                fontWeight: 600, fontSize: "14px", border: "none", cursor: "pointer",
                opacity: !newName.trim() ? 0.5 : 1, whiteSpace: "nowrap",
              }}
            >{createMutation.isPending ? "Adding..." : "+ Add"}</button>
          </div>
          <div style={{ paddingLeft: "52px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-body)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
              Category Color
            </p>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>
          {error && <p style={{ color: "var(--alert-expired-text)", fontSize: "13px", marginTop: "10px" }}>{error}</p>}
        </div>

        {/* ── List ── */}
        <div style={{
          background: "var(--card-bg)", borderRadius: "14px", padding: "24px",
          border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)",
        }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", margin: "0 0 16px" }}>
            Your Categories ({categories?.length || 0})
          </h2>

          {categories?.length === 0 && (
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", fontStyle: "italic" }}>No categories yet. Add one above!</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {categories?.map((cat: any) => (
              <div key={cat.id}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: editingId === cat.id ? "10px 10px 0 0" : "10px",
                  background: editingId === cat.id ? "var(--edit-row-bg)" : "var(--surface-subtle)",
                  border: `1px solid ${editingId === cat.id ? "var(--edit-row-border)" : "var(--border)"}`,
                  borderBottom: editingId === cat.id ? "none" : undefined, transition: "all 0.15s",
                }}>
                  {editingId === cat.id ? (
                    <div style={{ display: "flex", gap: "8px", flex: 1, marginRight: "12px", alignItems: "center" }}>
                      <button type="button" title="Change color"
                        onClick={() => setShowColorPicker(showColorPicker === cat.id ? null : cat.id)}
                        style={{
                          width: "32px", height: "32px", borderRadius: "8px", background: editColor || "var(--text-secondary)",
                          border: "2px solid rgba(0,0,0,0.1)", cursor: "pointer", flexShrink: 0,
                        }}
                      />
                      <input
                        value={editName} onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateMutation.mutate({ id: cat.id, name: editName, color: editColor });
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus style={{ ...inputStyle, flex: 1 }}
                      />
                      <button onClick={() => updateMutation.mutate({ id: cat.id, name: editName, color: editColor })}
                        style={{ padding: "8px 16px", background: "var(--brand)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" }}>
                        Save
                      </button>
                      <button onClick={cancelEdit}
                        style={{ padding: "8px 14px", background: "var(--btn-cancel-bg)", color: "var(--btn-cancel-color)", border: "1px solid var(--btn-cancel-border)", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: cat.color || "var(--text-secondary)", border: "2px solid rgba(0,0,0,0.08)", flexShrink: 0 }} />
                        <div>
                          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>{cat.name}</span>
                          {cat.color && (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                              <CategoryDot color={cat.color} />
                              <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-secondary)" }}>{cat.color}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => startEdit(cat)}
                          style={{ padding: "6px 14px", background: "var(--btn-edit-bg)", color: "var(--btn-edit-color)", border: "1px solid var(--btn-edit-border)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
                          Edit
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete "${cat.name}"? Items in this category will become uncategorized.`)) deleteMutation.mutate(cat.id); }}
                          style={{ padding: "6px 14px", background: "var(--alert-expired-bg)", color: "var(--alert-expired-text)", border: "1px solid var(--alert-expired-border)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {editingId === cat.id && showColorPicker === cat.id && (
                  <div style={{ padding: "16px 18px", background: "var(--edit-row-bg)", border: "1px solid var(--edit-row-border)", borderTop: "none", borderRadius: "0 0 10px 10px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-body)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Category Color</p>
                    <ColorPicker value={editColor} onChange={setEditColor} />
                  </div>
                )}
                {editingId === cat.id && showColorPicker !== cat.id && (
                  <div style={{ height: "8px", background: "var(--edit-row-bg)", border: "1px solid var(--edit-row-border)", borderTop: "none", borderRadius: "0 0 10px 10px" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
