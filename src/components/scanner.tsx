"use client"
import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { processScannedBarcode } from "@/app/actions/pantry";
import Link from "next/link";

// 1. Pass in categories from the parent (Dashboard or Scan Page)
export default function Scanner({ categories }: { categories: any[] }) {
    const [scannedItem, setScannedItem] = useState<{ itemName: string, upc: string } | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    const scannerRef = useRef<Html5Qrcode | null>(null);
    useEffect(() => {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode; 

        const qrCodeSuccessCallback = async (decodedText: string) => {
            console.log("Found UPC: ", decodedText);

            try {
                await html5QrCode.pause(true);
                const result = await processScannedBarcode(decodedText);
                
                if (result.success && result.item) {
                    setScannedItem({ itemName: result.item.itemName, upc: decodedText });
                } else {
                    alert("Product not found. Try again or enter manually.");
                    html5QrCode.resume();
                }
            } catch (err) {
                console.error("Scanner Error", err);
                html5QrCode.resume();
            }
        };

        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 150 } },
            qrCodeSuccessCallback,
            () => {}
        ).catch(err => console.error("Scanner failed to start", err));

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current
                    .stop()
                    .then(() => {
                        const container = document.getElementById("reader");
                        if (container) container.innerHTML = "";
                    })
                    .catch(err => console.error("Cleanup Error:", err));
            }
        };
    }, []);

    // 2. New function to handle the final save once category is picked
    const handleFinalSave = async () => {
        if (!selectedCategoryId) return alert("Please select a shelf!");
        setIsSaving(true);
        
        // We will update processScannedBarcode to take a categoryId
        const result = await processScannedBarcode(scannedItem!.upc, selectedCategoryId);
        
        if (result.success) {
            alert("Added to pantry!");
            setScannedItem(null); // Clear state to scan next item
            scannerRef.current?.resume();
        }
        setIsSaving(false);
    };

    return (
        <div className="flex flex-col items-center gap-6 p-4">
            {/* Back Button */}
            <Link href="/dashboard" className="self-start text-[#4A6FA5] hover:underline mb-2">
                ← Back to Dashboard
            </Link>

            <div id="reader" className={`w-full max-w-md ${scannedItem ? 'hidden' : 'block'}`}></div>

            {/* The "Confirm Item" UI */}
            {scannedItem && (
                <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg border-2 border-[#4A6FA5]">
                    <h3 className="text-xl font-bold text-[#2D3748]">{scannedItem.itemName}</h3>
                    <p className="text-sm text-[#A0AEC0] mb-4">UPC: {scannedItem.upc}</p>

                    <label className="block text-sm font-medium mb-1">Where does this go?</label>
                    <select 
                        className="w-full border rounded p-2 mb-4"
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                    >
                        <option value="">-- Select a Shelf --</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        <button 
                            onClick={handleFinalSave}
                            disabled={isSaving}
                            className="flex-1 bg-[#4A6FA5] text-white py-2 rounded font-bold"
                        >
                            {isSaving ? "Saving..." : "Confirm & Add"}
                        </button>
                        <button 
                            onClick={() => { setScannedItem(null); scannerRef.current?.resume(); }}
                            className="px-4 py-2 border rounded text-[#4A5568]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}