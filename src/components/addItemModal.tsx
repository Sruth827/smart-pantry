"use client"

import { useState, useActionState, useEffect } from "react"
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

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
      setUnitLabel("");
    }
  }, [state]);

return (
    <>
      {/* 1. The Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
      >
        + Add Item Manually
      </button>

      {/* 2. The Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-[#F7FAFC]">
              <h3 className="text-xl font-bold text-[#2D3748]">New Pantry Item</h3>
              <button onClick={() => setIsOpen(false)} className="text-[#A0AEC0] hover:text-[#4A5568]">✕</button>
            </div>

            {/* Form Body */}
            <form action={formAction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Item Name</label>
                <input name="itemName" required className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 text-black outline-none" placeholder="e.g. Whole Milk" />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Shelf / Category</label>
                <select 
                  name="categoryId" 
                  className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                <option value="">-- No Category --</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.color ? `● ${cat.name}` : cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Quantity</label>
                  <input name="quantity" type="number" step="0.1" defaultValue="1" className="w-full border rounded-md p-2 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Unit</label>
                  {/* Hidden input carries the value into FormData */}
                  <input type="hidden" name="unitLabel" value={unitLabel} />
                  <UnitDropdown
                    value={unitLabel}
                    onChange={setUnitLabel}
                    unitSystem={unitSystem}
                    placeholder="Select unit…"
                    inputStyle={{ fontSize: "14px", padding: "8px 10px", borderRadius: "6px" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Expiration Date</label>
                <input type="date" name="expirationDate" className="w-full border rounded-md p-2 text-black" />
              </div>

              {state?.error && <p className="text-red-500 text-sm italic">{state.error}</p>}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-md text-[#4A5568] hover:bg-[#F7FAFC]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-[#4A6FA5] text-white px-4 py-2 rounded-md hover:bg-[#3d5c8a] disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
