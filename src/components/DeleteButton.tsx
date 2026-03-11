"use client";

import { deletePantryItem } from "@/app/actions/pantry";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function DeleteButton({ itemId }: { itemId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

const handleDelete = async () => {
    if (confirm("Are you sure you want to remove this item?")) {
      setIsDeleting(true);
      
      const result = await deletePantryItem(itemId);
      
      if (result.success) {
        // 3. Force TanStack Query to refetch the list immediately
        queryClient.invalidateQueries({ queryKey: ['pantry'] });
      } else {
        alert("Could not delete item: " + result.error);
      }
      
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-400 hover:text-red-600 transition-colors p-1"
      title="Delete item"
    >
      {isDeleting ? "..." : "✕"}
    </button>
  );
}