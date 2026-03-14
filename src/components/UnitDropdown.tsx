"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Unit definitions ─────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (val: string) => void;
  unitSystem: "Imperial" | "Metric";
  placeholder?: string;
  inputStyle?: React.CSSProperties;
}

export default function UnitDropdown({
  value,
  onChange,
  unitSystem,
  placeholder = "Select or type unit…",
  inputStyle = {},
}: Props) {
  const units = unitSystem === "Imperial" ? IMPERIAL_UNITS : METRIC_UNITS;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when opening
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  const filtered = search.trim()
    ? units.filter(
        (u) =>
          u.label.toLowerCase().includes(search.toLowerCase()) ||
          u.abbr.toLowerCase().includes(search.toLowerCase()) ||
          u.group.toLowerCase().includes(search.toLowerCase())
      )
    : units;

  // Group the filtered list
  const grouped: Record<string, typeof units> = {};
  for (const u of filtered) {
    if (!grouped[u.group]) grouped[u.group] = [];
    grouped[u.group].push(u);
  }

  const select = useCallback(
    (abbr: string) => {
      onChange(abbr);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  // Display label for current value
  const displayLabel = (() => {
    const match = units.find((u) => u.abbr === value || u.label === value);
    return match ? `${match.label} (${match.abbr})` : value || "";
  })();

  const baseBtn: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0",
    borderRadius: "8px", fontSize: "14px", color: value ? "#2D3748" : "#A0AEC0",
    background: "#fff", outline: "none", boxSizing: "border-box",
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
          borderColor: open ? "#4A6FA5" : "#E2E8F0",
          boxShadow: open ? "0 0 0 3px rgba(74,111,165,0.12)" : "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {displayLabel || <span style={{ color: "#A0AEC0" }}>{placeholder}</span>}
        </span>
        <span style={{ color: "#A0AEC0", fontSize: "11px", flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          zIndex: 500, background: "#fff", border: "1px solid #E2E8F0",
          borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          overflow: "hidden",
          animation: "unitDropIn 0.14s ease",
        }}>
          {/* Search */}
          <div style={{ padding: "8px 8px 4px", borderBottom: "1px solid #F0F0F0" }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
                fontSize: "13px", color: "#A0AEC0", pointerEvents: "none",
              }}>🔍</span>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search units…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setOpen(false); setSearch(""); }
                  if (e.key === "Enter" && filtered.length === 1) select(filtered[0].abbr);
                }}
                style={{
                  width: "100%", padding: "7px 10px 7px 30px", border: "1px solid #E2E8F0",
                  borderRadius: "7px", fontSize: "13px", color: "#2D3748",
                  background: "#F7FAFC", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            {/* System badge */}
            <div style={{ padding: "4px 2px 0", fontSize: "11px", color: "#A0AEC0" }}>
              Showing <strong style={{ color: "#4A6FA5" }}>{unitSystem}</strong> units
              {value && (
                <button
                  type="button"
                  onClick={() => select("")}
                  style={{ float: "right", background: "none", border: "none", fontSize: "11px", color: "#dc2626", cursor: "pointer", padding: 0 }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Unit list */}
          <div style={{ maxHeight: "220px", overflowY: "auto" }}>
            {Object.keys(grouped).length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "#A0AEC0", fontSize: "13px" }}>
                No units match &ldquo;{search}&rdquo;
              </div>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  <div style={{
                    padding: "6px 12px 3px", fontSize: "10px", fontWeight: 700,
                    color: "#A0AEC0", textTransform: "uppercase", letterSpacing: "0.06em",
                    background: "#FAFAFA", borderTop: "1px solid #F0F0F0",
                  }}>
                    {group}
                  </div>
                  {items.map((u) => {
                    const isSelected = value === u.abbr || value === u.label;
                    return (
                      <button
                        key={u.abbr}
                        type="button"
                        onClick={() => select(u.abbr)}
                        style={{
                          width: "100%", padding: "8px 14px", textAlign: "left",
                          border: "none", background: isSelected ? "#EBF4FF" : "transparent",
                          cursor: "pointer", display: "flex", alignItems: "center",
                          justifyContent: "space-between", fontSize: "13px",
                          color: isSelected ? "#4A6FA5" : "#2D3748",
                          fontWeight: isSelected ? 700 : 400,
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#F7FAFC";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        <span>{u.label}</span>
                        <span style={{
                          fontSize: "11px", fontWeight: 600,
                          color: isSelected ? "#4A6FA5" : "#A0AEC0",
                          background: isSelected ? "#BED3F3" : "#F0F0F0",
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
