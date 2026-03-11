"use client"

import { useState, useActionState, useEffect } from "react"
import { createPantryItem } from "@/app/actions/pantry";


interface Category {
  id: string;
  name: string;
}

export default function AddItemForm({categories}: {categories : Category[]}) {
  // state will hold your { success, item, error } object
  // formAction is what you pass to the <form>
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createPantryItem, null);

  useEffect(() => {
    if(state?.success) {
      setIsOpen(false);
    } 
  }, [state]);
  
return (
    <>
      {/* 1. The Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all"
      >
        + Add Item Manually
      </button>

      {/* 2. The Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">New Pantry Item</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {/* Form Body */}
            <form action={formAction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input name="itemName" required className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. Whole Milk" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shelf / Category</label>
                <select 
                  name="categoryId" 
                  className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-green-500"
                >
                <option value="">-- No Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                    {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input name="quantity" type="number" step="0.1" defaultValue="1" className="w-full border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input name="unitLabel" placeholder="pcs, oz, gal" className="w-full border rounded-md p-2" />
                </div>
              </div>

              {state?.error && <p className="text-red-500 text-sm italic">{state.error}</p>}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
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