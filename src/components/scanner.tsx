"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { processScannedBarcode, bulkAddScannedItems } from "@/app/actions/pantry";
import Link from "next/link";

type ScannedItem = {
  id: string;
  itemName: string;
  upc: string;
  quantity: number;
  categoryId: string;
  unitLabel: string;
  expirationDate: string;
  notes: string;
  spoonacularId?: number;
};

type ScannerMode = "scanning" | "review";

export default function Scanner({ categories }: { categories: any[] }) {
  const [mode, setMode] = useState<ScannerMode>("scanning");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lastScannedLabel, setLastScannedLabel] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const processingRef = useRef(false);
  const scannedItemsRef = useRef<ScannedItem[]>([]);

  const defaultCategoryId = categories[0]?.id ?? "";
  const defaultExpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Keep ref in sync with state
  useEffect(() => {
    scannedItemsRef.current = scannedItems;
  }, [scannedItems]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        const container = document.getElementById("reader");
        if (container) container.innerHTML = "";
      } catch (err) {
        console.error("Stop error", err);
      }
      isScanningRef.current = false;
    }
  }, []);

  const startScanner = useCallback(() => {
    if (isScanningRef.current) return;

    const container = document.getElementById("reader");
    if (container) container.innerHTML = "";

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        async (decodedText: string) => {
          if (processingRef.current) return;
          processingRef.current = true;
          setIsLookingUp(true);

          try {
            // Check current items via ref (avoids stale closure)
            const existing = scannedItemsRef.current.find((i) => i.upc === decodedText);
            if (existing) {
              setScannedItems((prev) =>
                prev.map((i) =>
                  i.upc === decodedText ? { ...i, quantity: i.quantity + 1 } : i
                )
              );
              setLastScannedLabel(`+1 ${existing.itemName}`);
              setIsLookingUp(false);
              setTimeout(() => { processingRef.current = false; }, 1200);
              return;
            }

            // New UPC — look up via API
            const result = await processScannedBarcode(decodedText);
            if (result.success && result.item) {
              const newItem: ScannedItem = {
                id: `${decodedText}-${Date.now()}`,
                itemName: result.item.itemName,
                upc: decodedText,
                quantity: 1,
                categoryId: defaultCategoryId,
                unitLabel: "pcs",
                expirationDate: defaultExpDate,
                notes: "",
                spoonacularId: result.item.spoonacularId,
              };
              setScannedItems((prev) => {
                // Guard against race: double-check it wasn't added while awaiting
                if (prev.some((i) => i.upc === decodedText)) {
                  return prev.map((i) =>
                    i.upc === decodedText ? { ...i, quantity: i.quantity + 1 } : i
                  );
                }
                return [...prev, newItem];
              });
              setLastScannedLabel(`Added: ${result.item.itemName}`);
            } else {
              setLastScannedLabel(`Not found: ${decodedText}`);
            }
          } catch (err) {
            console.error("Scanner error", err);
            setLastScannedLabel("Error looking up item");
          } finally {
            setIsLookingUp(false);
            setTimeout(() => { processingRef.current = false; }, 1500);
          }
        },
        () => {}
      )
      .then(() => { isScanningRef.current = true; })
      .catch((err: any) => console.error("Scanner failed to start", err));
  }, [defaultCategoryId, defaultExpDate]);

  useEffect(() => {
    if (mode === "scanning") {
      startScanner();
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleGoToReview = async () => {
    await stopScanner();
    setMode("review");
  };

  const handleBackToScanning = () => {
    setMode("scanning");
  };

  const handleUpdateItem = (id: string, field: keyof ScannedItem, value: any) => {
    setScannedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setScannedItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleBulkAdd = async () => {
    if (scannedItems.length === 0) return;
    setIsSaving(true);
    const count = scannedItems.length;
    const result = await bulkAddScannedItems(scannedItems);
    if (result.success) {
      setSaveSuccess(true);
      setScannedItems([]);
      setLastScannedLabel(null);
      setTimeout(() => {
        setSaveSuccess(false);
        setMode("scanning");
      }, 2200);
    } else {
      alert("Something went wrong. Please try again.");
    }
    setIsSaving(false);
  };

  // ─── REVIEW MODE ─────────────────────────────────────────────────────────────
  if (mode === "review") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToScanning}
            className="flex items-center gap-1 text-[#4A6FA5] hover:underline text-sm font-medium"
          >
            ← Keep Scanning
          </button>
          <h1 className="text-xl font-bold text-[#2D3748]">Review Items</h1>
          <span className="text-sm text-[#718096]">
            {scannedItems.length} item{scannedItems.length !== 1 ? "s" : ""}
          </span>
        </div>

        {saveSuccess && (
          <div className="mb-4 bg-green-100 border border-green-300 text-green-800 rounded-lg px-4 py-3 text-center font-medium animate-pulse">
            ✓ Items added to your pantry!
          </div>
        )}

        {scannedItems.length === 0 && !saveSuccess && (
          <div className="text-center py-16 text-[#A0AEC0]">
            <p className="text-5xl mb-3">📭</p>
            <p className="text-lg font-medium text-[#718096]">No items scanned yet.</p>
            <button
              onClick={handleBackToScanning}
              className="mt-4 text-[#4A6FA5] underline text-sm"
            >
              Go back to scan items
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-24">
          {scannedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4"
            >
              {editingId === item.id ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <input
                      className="text-base font-semibold text-[#2D3748] border-b border-[#CBD5E0] focus:outline-none focus:border-[#4A6FA5] w-full mr-2 pb-0.5 bg-transparent"
                      value={item.itemName}
                      onChange={(e) => handleUpdateItem(item.id, "itemName", e.target.value)}
                    />
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-[#4A6FA5] text-sm font-semibold shrink-0 ml-2"
                    >
                      Done
                    </button>
                  </div>
                  <p className="text-xs text-[#A0AEC0] font-mono">UPC: {item.upc}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#718096] font-medium block mb-1">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm focus:outline-none focus:border-[#4A6FA5]"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#718096] font-medium block mb-1">Unit</label>
                      <input
                        className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm focus:outline-none focus:border-[#4A6FA5]"
                        value={item.unitLabel}
                        onChange={(e) => handleUpdateItem(item.id, "unitLabel", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#718096] font-medium block mb-1">Shelf / Category</label>
                    <select
                      className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm focus:outline-none focus:border-[#4A6FA5]"
                      value={item.categoryId}
                      onChange={(e) => handleUpdateItem(item.id, "categoryId", e.target.value)}
                    >
                      <option value="">-- No shelf --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[#718096] font-medium block mb-1">Expiration Date</label>
                    <input
                      type="date"
                      className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm focus:outline-none focus:border-[#4A6FA5]"
                      value={item.expirationDate}
                      onChange={(e) => handleUpdateItem(item.id, "expirationDate", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#718096] font-medium block mb-1">Notes</label>
                    <input
                      className="w-full border border-[#E2E8F0] rounded-lg p-2 text-sm focus:outline-none focus:border-[#4A6FA5]"
                      placeholder="Optional notes..."
                      value={item.notes}
                      onChange={(e) => handleUpdateItem(item.id, "notes", e.target.value)}
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-400 hover:text-red-600 text-sm self-start mt-1"
                  >
                    🗑 Remove item
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#2D3748] truncate">{item.itemName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-sm text-[#718096]">
                        ×{item.quantity} {item.unitLabel}
                      </span>
                      {item.categoryId && (
                        <span className="text-xs bg-[#EBF4FF] text-[#4A6FA5] px-2 py-0.5 rounded-full font-medium">
                          {categories.find((c) => c.id === item.categoryId)?.name ?? ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="text-[#4A6FA5] text-sm px-3 py-1.5 rounded-lg border border-[#4A6FA5] hover:bg-[#EBF4FF] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-[#CBD5E0] hover:text-red-400 text-xl leading-none transition-colors px-1"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {scannedItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#F5F0EB]/90 backdrop-blur border-t border-[#E2E8F0]">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={handleBulkAdd}
                disabled={isSaving}
                className="w-full bg-[#4A6FA5] hover:bg-[#3a5a8f] text-white font-bold py-4 rounded-xl shadow-lg text-base transition-colors disabled:opacity-60"
              >
                {isSaving
                  ? "Adding to Pantry…"
                  : `Add ${scannedItems.length} Item${scannedItems.length !== 1 ? "s" : ""} to Pantry`}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── SCANNING MODE ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto px-4 py-6 flex flex-col items-center gap-4">
      <div className="w-full flex items-center justify-between mb-1">
        <Link href="/dashboard" className="text-[#4A6FA5] hover:underline text-sm font-medium">
          ← Dashboard
        </Link>
        <h1 className="text-lg font-bold text-[#2D3748]">Scan Items</h1>
        <div className="w-24" />
      </div>

      {/* Scanner Viewfinder */}
      <div className="w-full bg-black rounded-2xl overflow-hidden shadow-xl relative">
        <div id="reader" className="w-full" />
        {isLookingUp && (
          <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
            <div className="bg-white rounded-xl px-5 py-3 flex items-center gap-3 shadow-lg">
              <svg className="animate-spin h-5 w-5 text-[#4A6FA5]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-sm font-medium text-[#2D3748]">Looking up item…</span>
            </div>
          </div>
        )}
      </div>

      {/* Last scan feedback */}
      {lastScannedLabel && !isLookingUp && (
        <div className="w-full text-center text-sm bg-white rounded-lg px-4 py-2.5 border border-[#E2E8F0] text-[#4A6FA5] font-medium">
          {lastScannedLabel}
        </div>
      )}

      {/* Scanned Items List */}
      {scannedItems.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-[#F7FAFC] bg-[#FAFAFA]">
            <span className="text-xs font-semibold text-[#718096] uppercase tracking-wide">
              Scanned — {scannedItems.length} item{scannedItems.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-[#F7FAFC] max-h-52 overflow-y-auto">
            {scannedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-[#2D3748] truncate flex-1 mr-2">{item.itemName}</span>
                <span className="text-sm font-bold text-[#4A6FA5] shrink-0 bg-[#EBF4FF] px-2 py-0.5 rounded-full">
                  ×{item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tip text */}
      {scannedItems.length === 0 && (
        <p className="text-sm text-[#A0AEC0] text-center px-4">
          Point your camera at a barcode to scan. Duplicates will automatically increase the quantity.
        </p>
      )}

      {/* Done Scanning Button */}
      <button
        onClick={handleGoToReview}
        className={`w-full font-bold py-3.5 rounded-xl text-base transition-all shadow-sm ${
          scannedItems.length > 0
            ? "bg-[#4A6FA5] text-white shadow-md hover:bg-[#3a5a8f]"
            : "bg-[#E2E8F0] text-[#A0AEC0] cursor-not-allowed"
        }`}
        disabled={scannedItems.length === 0}
      >
        {scannedItems.length > 0
          ? `Review ${scannedItems.length} Item${scannedItems.length !== 1 ? "s" : ""} →`
          : "Scan items to continue"}
      </button>
    </div>
  );
}
