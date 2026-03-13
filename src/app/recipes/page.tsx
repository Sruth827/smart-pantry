"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import AppShell from "@/components/AppShell";

export default function RecipesPage() {
  const { data: session, status } = useSession({ required: true });
  const [recipes, setRecipes] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [recipeDetail, setRecipeDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [excludedItems, setExcludedItems] = useState<Set<string>>(new Set());
  const [filterSearch, setFilterSearch] = useState("");

  const { data: pantryData, isLoading } = useQuery({
    queryKey: ["pantry", session?.user?.email],
    queryFn: () => fetch("/api/pantry").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  const allItems: any[] = [];
  if (Array.isArray(pantryData)) {
    pantryData.forEach((cat: any) => {
      if (cat.items) allItems.push(...cat.items);
    });
  }

  const activeItems = allItems.filter((i) => !excludedItems.has(i.itemName));
  const ingredientNames = activeItems.map((i) => i.itemName).join(",");

  const toggleExclude = (itemName: string) => {
    setExcludedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemName)) next.delete(itemName);
      else next.add(itemName);
      return next;
    });
  };

  const filteredPopupItems = allItems.filter((i) =>
    i.itemName.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const searchRecipes = async () => {
    if (!ingredientNames) return;
    setSearching(true);
    setError("");
    setSearched(true);
    try {
      const res = await fetch(`/api/recipes?ingredients=${encodeURIComponent(ingredientNames)}`);
      const data = await res.json();
      if (data.error) { setError(data.error); setRecipes([]); }
      else setRecipes(data);
    } catch {
      setError("Failed to search recipes. Check your API key configuration.");
    } finally {
      setSearching(false);
    }
  };

  const viewRecipe = async (recipe: any) => {
    setSelectedRecipe(recipe);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`);
      const data = await res.json();
      setRecipeDetail(data);
    } catch {
      setRecipeDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (status === "loading" || isLoading) {
    return <AppShell><div style={{ padding: "48px", textAlign: "center", color: "var(--text-body)" }}>Loading...</div></AppShell>;
  }

  return (
    <AppShell>
      <div style={{ padding: "40px 48px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Recipes</h1>
          <p style={{ color: "var(--text-body)", marginTop: "6px", fontSize: "15px" }}>
            Discover recipes you can make with your pantry ingredients.
          </p>
        </div>

        {/* Pantry summary + Search */}
        <div style={{ background: "var(--card-bg)", borderRadius: "14px", padding: "24px", border: "1px solid var(--border)", marginBottom: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Your Pantry Ingredients</h2>
              <p style={{ color: "var(--text-body)", fontSize: "13px", marginTop: "4px" }}>
                {activeItems.length} of {allItems.length} items will be matched against Spoonacular recipes.
                {excludedItems.size > 0 && (
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}> ({excludedItems.size} excluded)</span>
                )}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={() => setShowFilterPopup(true)}
                disabled={allItems.length === 0}
                style={{
                  padding: "10px 18px", borderRadius: "10px",
                  background: excludedItems.size > 0 ? "var(--alert-soon-bg)" : "var(--surface-subtle)",
                  color: excludedItems.size > 0 ? "var(--alert-soon-text)" : "var(--text-body)",
                  fontWeight: 700, fontSize: "14px",
                  border: excludedItems.size > 0 ? "1px solid var(--alert-soon-border)" : "1px solid var(--border)",
                  cursor: allItems.length === 0 ? "not-allowed" : "pointer",
                  opacity: allItems.length === 0 ? 0.5 : 1,
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                {`\uD83D\uDEAB Exclude Items${excludedItems.size > 0 ? ` (${excludedItems.size})` : ""}`}
              </button>
              <button
                onClick={searchRecipes}
                disabled={searching || activeItems.length === 0}
                style={{
                  padding: "10px 24px", borderRadius: "10px", background: "var(--brand)",
                  color: "#fff", fontWeight: 700, fontSize: "14px", border: "none",
                  cursor: activeItems.length === 0 ? "not-allowed" : "pointer",
                  opacity: activeItems.length === 0 ? 0.5 : 1,
                }}
              >
                {searching ? "Searching..." : "\uD83D\uDD0D Find Recipes"}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {allItems.slice(0, 20).map((item) => (
              <span key={item.id} style={{
                padding: "4px 12px", borderRadius: "20px", fontSize: "12px",
                background: excludedItems.has(item.itemName) ? "var(--surface-subtle)" : "var(--accent-subtle, #F5EDE4)",
                color: excludedItems.has(item.itemName) ? "var(--text-secondary)" : "#A0724A",
                border: `1px solid ${excludedItems.has(item.itemName) ? "var(--border)" : "var(--accent-border, #D4B49A)"}`,
                fontWeight: 500,
                textDecoration: excludedItems.has(item.itemName) ? "line-through" : "none",
              }}>{item.itemName}</span>
            ))}
            {allItems.length > 20 && (
              <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", background: "var(--surface-subtle)", color: "var(--text-secondary)" }}>
                +{allItems.length - 20} more
              </span>
            )}
          </div>
        </div>

        {/* Filter Popup */}
        {showFilterPopup && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
            onClick={() => setShowFilterPopup(false)}
          >
            <div
              style={{ background: "var(--card-bg)", borderRadius: "18px", maxWidth: "480px", width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Exclude Ingredients</h2>
                  <button onClick={() => setShowFilterPopup(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-secondary)" }}>&#x2715;</button>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 14px" }}>
                  Select items you <strong>don&apos;t</strong> want included in your recipe search.
                </p>
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 14px", borderRadius: "8px",
                    border: "1px solid var(--border)", fontSize: "14px", outline: "none",
                    boxSizing: "border-box", color: "var(--input-color)", background: "var(--input-bg)",
                  }}
                />
              </div>
              <div style={{ overflowY: "auto", flex: 1, padding: "12px 24px" }}>
                {filteredPopupItems.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", padding: "24px 0" }}>No items match your search.</p>
                ) : (
                  filteredPopupItems.map((item) => {
                    const excluded = excludedItems.has(item.itemName);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleExclude(item.itemName)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 14px", borderRadius: "10px", marginBottom: "6px",
                          background: excluded ? "var(--alert-soon-bg)" : "var(--surface-subtle)",
                          border: `1px solid ${excluded ? "var(--alert-soon-border)" : "var(--border)"}`,
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        <span style={{
                          fontSize: "14px", fontWeight: 500,
                          color: excluded ? "var(--alert-soon-text)" : "var(--foreground)",
                          textDecoration: excluded ? "line-through" : "none",
                        }}>
                          {item.itemName}
                        </span>
                        <div style={{
                          width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                          background: excluded ? "var(--alert-soon-text)" : "var(--card-bg)",
                          border: `2px solid ${excluded ? "var(--alert-soon-text)" : "var(--border)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {excluded && <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>&#x2715;</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={() => setExcludedItems(new Set())}
                  disabled={excludedItems.size === 0}
                  style={{
                    padding: "9px 16px", borderRadius: "8px", border: "1px solid var(--border)",
                    background: "var(--card-bg)", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600,
                    cursor: excludedItems.size === 0 ? "not-allowed" : "pointer",
                    opacity: excludedItems.size === 0 ? 0.5 : 1,
                  }}
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilterPopup(false)}
                  style={{
                    padding: "9px 24px", borderRadius: "8px", background: "var(--brand)",
                    color: "#fff", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer",
                  }}
                >
                  Apply ({activeItems.length} items included)
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "var(--alert-expired-bg)", border: "1px solid var(--alert-expired-border)", borderRadius: "10px", padding: "16px", marginBottom: "16px", color: "var(--alert-expired-text)", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* Recipe Grid */}
        {recipes.length > 0 && (
          <>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)", marginBottom: "16px" }}>
              {recipes.length} Recipes Found
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {recipes.map((recipe: any) => (
                <div
                  key={recipe.id}
                  onClick={() => viewRecipe(recipe)}
                  style={{
                    background: "var(--card-bg)", borderRadius: "14px", border: "1px solid var(--border)",
                    overflow: "hidden", cursor: "pointer", transition: "all 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  {recipe.image && (
                    <img src={recipe.image} alt={recipe.title} style={{ width: "100%", height: "160px", objectFit: "cover" }} />
                  )}
                  <div style={{ padding: "16px" }}>
                    <h3 style={{ fontWeight: 700, fontSize: "15px", color: "var(--foreground)", margin: "0 0 8px" }}>{recipe.title}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                        background: recipe.usedIngredientCount >= 3 ? "var(--accent-subtle)" : "var(--alert-soon-bg)",
                        color: recipe.usedIngredientCount >= 3 ? "var(--accent)" : "var(--alert-soon-text)",
                        border: `1px solid ${recipe.usedIngredientCount >= 3 ? "var(--accent-border)" : "var(--alert-soon-border)"}`,
                      }}>
                        ✓ {recipe.usedIngredientCount} from pantry
                      </span>
                      {recipe.missedIngredientCount > 0 && (
                        <span style={{
                          padding: "4px 10px", borderRadius: "20px", fontSize: "12px",
                          background: "var(--surface-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border)",
                        }}>
                          {recipe.missedIngredientCount} missing
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {searched && recipes.length === 0 && !error && !searching && (
          <div style={{ background: "var(--card-bg)", borderRadius: "16px", padding: "48px", textAlign: "center", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🍽️</div>
            <h2 style={{ color: "var(--foreground)", fontWeight: 700 }}>No recipes found</h2>
            <p style={{ color: "var(--text-body)" }}>Try adding more items to your pantry.</p>
          </div>
        )}

        {/* Recipe Detail Modal */}
        {selectedRecipe && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
            onClick={() => { setSelectedRecipe(null); setRecipeDetail(null); }}
          >
            <div
              style={{ background: "var(--card-bg)", borderRadius: "16px", maxWidth: "600px", width: "100%", maxHeight: "80vh", overflow: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedRecipe.image && (
                <img src={selectedRecipe.image} alt={selectedRecipe.title} style={{ width: "100%", height: "220px", objectFit: "cover", borderRadius: "16px 16px 0 0" }} />
              )}
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--foreground)", margin: 0, flex: 1 }}>{selectedRecipe.title}</h2>
                  <button onClick={() => { setSelectedRecipe(null); setRecipeDetail(null); }} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-secondary)", marginLeft: "12px" }}>✕</button>
                </div>

                {loadingDetail ? (
                  <p style={{ color: "var(--text-body)" }}>Loading recipe details...</p>
                ) : recipeDetail ? (
                  <>
                    {recipeDetail.readyInMinutes && (
                      <p style={{ color: "var(--text-body)", fontSize: "14px", marginBottom: "16px" }}>
                        ⏱️ Ready in {recipeDetail.readyInMinutes} minutes · 🍽️ Serves {recipeDetail.servings}
                      </p>
                    )}
                    <div style={{ marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", marginBottom: "8px" }}>Pantry Ingredients Used</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {selectedRecipe.usedIngredients?.map((ing: any) => (
                          <span key={ing.id} style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", background: "#F5EDE4", color: "#A0724A", border: "1px solid #D4B49A" }}>
                            ✓ {ing.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedRecipe.missedIngredients?.length > 0 && (
                      <div style={{ marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", marginBottom: "8px" }}>Still Need</h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {selectedRecipe.missedIngredients.map((ing: any) => (
                            <span key={ing.id} style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", background: "var(--alert-soon-bg)", color: "var(--alert-soon-text)", border: "1px solid var(--alert-soon-border)" }}>
                              {ing.original}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {recipeDetail.sourceUrl && (
                      <a href={recipeDetail.sourceUrl} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-block", marginTop: "8px", padding: "10px 20px", background: "var(--brand)", color: "#fff", borderRadius: "10px", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>
                        View Full Recipe →
                      </a>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
