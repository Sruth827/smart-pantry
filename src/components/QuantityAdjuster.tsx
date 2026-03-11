"use client";

import { adjustQuantity } from "@/app/actions/pantry";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function QuantityPicker({ itemId, currentQty }: { itemId: string, currentQty: number }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleAdjust = async (amount: number) => {
    setLoading(true);
    const result = await adjustQuantity(itemId, amount);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <button 
        onClick={() => handleAdjust(-1)}
        disabled={loading || currentQty <= 0}
        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:bg-red-50 text-red-600 disabled:opacity-50"
      >
        -
      </button>
      
      <span className="w-8 text-center font-bold text-sm">
        {currentQty}
      </span>

      <button 
        onClick={() => handleAdjust(1)}
        disabled={loading}
        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:bg-green-50 text-green-600 disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}