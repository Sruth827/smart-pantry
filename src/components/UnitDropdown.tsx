"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export const IMPERIAL_UNITS = [
  { group: "Volume",  label: "teaspoon",      abbr: "tsp"  },
  { group: "Volume",  label: "tablespoon",    abbr: "tbsp" },
  { group: "Volume",  label: "fluid ounce",   abbr: "fl oz"},
  { group: "Volume",  label: "cup",           abbr: "cup"  },
  { group: "Volume",  label: "pint",          abbr: "pt"   },
  { group: "Volume",  label: "quart",         abbr: "qt"   },
  { group: "Volume",  label: "gallon",        abbr: "gal"  },
  { group: "Weight",  label: "ounce",         abbr: "oz"   },
  { group: "Weight",  label: "pound",         abbr: "lb"   },
  { group: "Count",   label: "piece",         abbr: "pc"   },
  { group: "Count",   label: "dozen",         abbr: "doz"  },
  { group: "Count",   label: "pack",          abbr: "pack" },
  { group: "Count",   label: "bag",           abbr: "bag"  },
  { group: "Count",   label: "box",           abbr: "box"  },
  { group: "Count",   label: "can",           abbr: "can"  },
  { group: "Count",   label: "jar",           abbr: "jar"  },
  { group: "Count",   label: "bottle",        abbr: "btl"  },
  { group: "Length",  label: "inch",          abbr: "in"   },
];

export const METRIC_UNITS = [
  { group: "Volume",  label: "milliliter",    abbr: "ml"   },
  { group: "Volume",  label: "liter",         abbr: "L"    },
  { group: "Weight",  label: "gram",          abbr: "g"    },
  { group: "Weight",  label: "kilogram",      abbr: "kg"   },
  { group: "Weight",  label: "milligram",     abbr: "mg"   },
  { group: "Count",   label: "piece",         abbr: "pc"   },
  { group: "Count",   label: "dozen",         abbr: "doz"  },
  { group: "Count",   label: "pack",          abbr: "pack" },
  { group: "Count",   label: "bag",           abbr: "bag"  },
  { group: "Count",   label: "box",           abbr: "box"  },
  { group: "Count",   label: "can",           abbr: "can"  },
  { group: "Count",   label: "jar",           abbr: "jar"  },
  { group: "Count",   label: "bottle",        abbr: "btl"  },
  { group: "Length",  label: "centimeter",    abbr: "cm"   },
  { group: "Length",  label: "meter",         abbr: "m"    },
];

interface Props {
  value: string;
  onChange: (val: string) => void;
  unitSystem: "Imperial" | "Metric";
  placeholder?: string;
  inputStyle?: React.CSSProperties;
}

export default function UnitDropdown({
  value, onChange, unitSystem, placeholder = "Select or type unit…", inputStyle = {},
}: Props) {
  const units = unitSystem === "Imperial" ? IMPERIAL_UNITS : METRIC_UNITS;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  const filtered = search.trim()
    ? units.filter((u) =>
        u.label.toLowerCase().includes(search.toLowerCase()) ||
        u.abbr.toLowerCase().includes(search.toLowerCase()) ||
        u.group.toLowerCase().includes(search.toLowerCase())
      )
    : units;

  const grouped: Record<string, typeof units> = {};
  for (const u of filtered) {
    if (!grouped[u.group]) grouped[u.group] = [];
    grouped[u.group].push(u);
  }

  const select = useCallback((abbr: string) => { onChange(abbr); setOpen(false); setSearch(""); }, [onChange]);

  const displayLabel = (() => {
    const match = units.find((u) => u.abbr === value || u.label === value);
    return match ? `${match.label} (${match.abbr})` : value || "";
  })();

  const baseBtn: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1px solid var(--input-border)",
    borderRadius: "8px", fontSize: "14px", color: value ? "var(--input-color)" : "var(--text-secondary)",
    background: "var(--input-bg)", outline: "none", boxSizing: "border-box",
    cursor: "pointer", textAlign: "left", display: "flex",
    alignItems: "center", justifyContent: "space-between", gap: "6px",
    ...inputStyle,
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...baseBtn,
          borderColor: open ? "var(--brand)" : "var(--input-border)",
          boxShadow: open ? "0 0 0 3px rgba(74,111,165,0.15)" : "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {displayLabel || <span style={{ color: "var(--text-secondary)" }}>{placeholder}</span>}
        </span>
        <span style={{ color: "var(--text-secondary)", fontSize: "11px", flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          zIndex: 500, background: "var(--card-bg)", border: "1px solid var(--border)",
          borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          overflow: "hidden", animation: "unitDropIn 0.14s ease",
        }}>
          {/* Search */}
          <div style={{ padding: "8px 8px 4px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "var(--text-secondary)", pointerEvents: "none" }}>🔍</span>
              <input
                ref={searchRef} type="text" placeholder="Search units…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setOpen(false); setSearch(""); }
                  if (e.key === "Enter" && filtered.length === 1) select(filtered[0].abbr);
                }}
                style={{
                  width: "100%", padding: "7px 10px 7px 30px", border: "1px solid var(--input-border)",
                  borderRadius: "7px", fontSize: "13px", color: "var(--input-color)",
                  background: "var(--surface-subtle)", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ padding: "4px 2px 0", fontSize: "11px", color: "var(--text-secondary)" }}>
              Showing <strong style={{ color: "var(--brand)" }}>{unitSystem}</strong> units
              {value && (
                <button type="button" onClick={() => select("")} style={{ float: "right", background: "none", border: "none", fontSize: "11px", color: "var(--alert-expired-text)", cursor: "pointer", padding: 0 }}>Clear</button>
              )}
            </div>
          </div>

          {/* Unit list */}
          <div style={{ maxHeight: "220px", overflowY: "auto" }}>
            {Object.keys(grouped).length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                No units match &ldquo;{search}&rdquo;
              </div>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  <div style={{
                    padding: "6px 12px 3px", fontSize: "10px", fontWeight: 700,
                    color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em",
                    background: "var(--surface-subtle)", borderTop: "1px solid var(--border)",
                  }}>
                    {group}
                  </div>
                  {items.map((u) => {
                    const isSelected = value === u.abbr || value === u.label;
                    return (
                      <button
                        key={u.abbr} type="button" onClick={() => select(u.abbr)}
                        style={{
                          width: "100%", padding: "8px 14px", textAlign: "left",
                          border: "none", background: isSelected ? "var(--btn-edit-bg)" : "transparent",
                          cursor: "pointer", display: "flex", alignItems: "center",
                          justifyContent: "space-between", fontSize: "13px",
                          color: isSelected ? "var(--brand)" : "var(--foreground)",
                          fontWeight: isSelected ? 700 : 400, transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--surface-subtle)"; }}
                        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <span>{u.label}</span>
                        <span style={{
                          fontSize: "11px", fontWeight: 600,
                          color: isSelected ? "var(--brand)" : "var(--text-secondary)",
                          background: isSelected ? "var(--edit-row-border)" : "var(--border)",
                          padding: "2px 7px", borderRadius: "10px",
                        }}>{u.abbr}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes unitDropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
