"use server";
import { revalidatePath } from "next/cache";
import { db } from '@/lib/db';
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";


export async function createPantryItem(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }

  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) {
    return { success: false, error: "User not found" };
  }

  const itemName = formData.get("itemName") as string;
  const quantity = parseFloat(formData.get("quantity") as string) || 1;
  const unitLabel = formData.get("unitLabel") as string || "pcs";
  const categoryId = formData.get("categoryId") as string;
  const expirationDate = formData.get("expirationDate") as string;
  const notes = (formData.get("notes") as string) || null;
  const formThreshold = parseFloat(formData.get("lowThreshold") as string) || 0;

  try {
    // ── Threshold migration: check for existing siblings BEFORE creating ──────
    // Find all existing items with the same name (case-insensitive) for this user
    const siblings = await db.pantryItem.findMany({
      where: {
        userId: session.user.id,
        itemName: { equals: itemName, mode: "insensitive" },
      },
    });

    // Determine the threshold to use for the new item:
    // - If there is exactly 1 sibling, it may have a threshold set → this becomes the group threshold
    // - If there are already 2+ siblings, all should share the same threshold → use theirs
    // - If there are no siblings, no threshold migration needed
    let inheritedThreshold = formThreshold;
    if (siblings.length === 1) {
      // Going from 1 → 2: promote the singleton's threshold to become the group threshold
      const singletonThreshold = Number(siblings[0].lowThreshold);
      if (singletonThreshold > 0) {
        inheritedThreshold = singletonThreshold;
        // Zero out the existing singleton's threshold (now managed at group level)
        await db.pantryItem.update({
          where: { id: siblings[0].id },
          data: { lowThreshold: 0 },
        });
      }
    } else if (siblings.length >= 2) {
      // Already a group — inherit whatever group threshold the siblings share
      const groupThreshold = Number(siblings[0].lowThreshold);
      if (groupThreshold > 0) inheritedThreshold = groupThreshold;
    }

    const newItem = await db.pantryItem.create({
      data: {
        itemName,
        quantity,
        unitLabel,
        lowThreshold: inheritedThreshold,
        notes: notes || null,
        expirationDate: expirationDate
          ? new Date(expirationDate)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { connect: { id: session.user.id } },
        ...(categoryId && { category: { connect: { id: categoryId } } }),
      },
    });

    revalidatePath("/dashboard");
    return {
      success: true, item: {
        ...newItem,
        quantity: Number(newItem.quantity),
        lowThreshold: Number(newItem.lowThreshold),
        expirationDate: newItem.expirationDate!.toISOString(),
        updatedAt: newItem.updatedAt.toISOString(),
      }
    };

    return {
      success: true,
      item: {
        ...newItem,
        quantity: Number(newItem.quantity),
      },
    };
  } catch (error) {
    console.error("Create Error:", error);
    return { success: false, error: "Failed to create item." };
  }
}


async function lookupUPC(upc: string): Promise<{ itemName: string; source: string } | null> {
  // ── 1. Open Food Facts (free, 4M+ products, no key needed) ──────────────────
  try {
    const offRes = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${upc}.json?fields=product_name,brands,generic_name`,
      { headers: { "User-Agent": "SmartPantry/1.0" }, next: { revalidate: 0 } }
    );
    if (offRes.ok) {
      const offData = await offRes.json();
      if (offData.status === 1 && offData.product) {
        const name =
          offData.product.product_name ||
          offData.product.generic_name ||
          "";
        const brand = offData.product.brands?.split(",")[0]?.trim() || "";
        const fullName = brand && !name.toLowerCase().includes(brand.toLowerCase())
          ? `${brand} ${name}`.trim()
          : name.trim();
        if (fullName) {
          console.log(`[Barcode] OFF hit: "${fullName}"`);
          return { itemName: fullName, source: "openfoodfacts" };
        }
      }
    }
  } catch (err) {
    console.warn("[Barcode] OFF lookup failed:", err);
  }

  // ── 2. Spoonacular fallback ──────────────────────────────────────────────────
  const API_KEY = process.env.SPOONACULAR_API_KEY;
  if (API_KEY) {
    try {
      const spoonRes = await fetch(
        `https://api.spoonacular.com/food/products/upc/${upc}?apiKey=${API_KEY}`,
        { next: { revalidate: 0 } }
      );
      if (spoonRes.ok) {
        const spoonData = await spoonRes.json();
        const name = spoonData.title?.trim();
        if (name) {
          console.log(`[Barcode] Spoonacular hit: "${name}"`);
          return { itemName: name, source: "spoonacular" };
        }
      }
    } catch (err) {
      console.warn("[Barcode] Spoonacular lookup failed:", err);
    }
  }

  console.warn(`[Barcode] No match found for UPC: ${upc}`);
  return null;
}

export async function processScannedBarcode(upc: string, categoryId?: string) {
  console.log("Server Action: Processing UPC", upc);
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.log("Auth Error: No session user ID found");
    return { success: false, error: "You must be logged in to add items." };
  }

  try {
    const result = await lookupUPC(upc);

    if (!result) {
      return { success: false, error: "Product not found in any database." };
    }

    const { itemName } = result;

    // Return item data without saving (scanner collects items before bulk-add)
    if (!categoryId) {
      return {
        success: true,
        item: { itemName, upc }
      };
    }

    // Direct save path (legacy single-item flow)
    const newItem = await db.pantryItem.create({
      data: {
        itemName,
        quantity: 1,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { connect: { email: session.user.email as string } },
        category: { connect: { id: categoryId } },
      },
    });

    console.log("Item saved to DB:", newItem.itemName);
    revalidatePath("/dashboard");
    revalidatePath("/pantry");

    return {
      success: true,
      item: {
        ...newItem,
        quantity: Number(newItem.quantity),
        lowThreshold: Number(newItem.lowThreshold),
      },
    };
  } catch (error) {
    console.error("Barcode lookup/save error:", error);
    return { success: false, error: "Could not find or save item." };
  }
}


export async function deletePantryItem(itemId: string) {
  const session = await getServerSession(authOptions);

  // Must be logged in
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.pantryItem.delete({
      where: {
        id: itemId,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Failed to delete item." };
  }
}


export async function adjustQuantity(itemId: string, amount: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const updatedItem = await db.pantryItem.update({
      where: { 
        id: itemId, 
        userId: session.user.id 
      },
      data: {
        // This handles both adding (1) and subtracting (-1)
        quantity: { increment: amount }
      }
    });

    // Security: If quantity drops below 0, reset it to 0
    if (Number(updatedItem.quantity) < 0) {
      await db.pantryItem.update({
        where: { id: itemId },
        data: { quantity: 0 }
      });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}


export async function bulkAddScannedItems(
  items: Array<{
    itemName: string;
    upc: string;
    quantity: number;
    categoryId: string;
    unitLabel: string;
    expirationDate?: string;
    notes?: string;
  }>
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const results = await Promise.all(
      items.map(async (item) => {
        const newItem = await db.pantryItem.create({
          data: {
            itemName: item.itemName,
            quantity: item.quantity,
            unitLabel: item.unitLabel || "pcs",
            expirationDate: item.expirationDate
              ? new Date(item.expirationDate)
              : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            notes: item.notes || null,
            user: { connect: { id: session.user.id } },
            ...(item.categoryId && { category: { connect: { id: item.categoryId } } }),
          },
        });
        return newItem;
      })
    );

    revalidatePath("/dashboard");
    revalidatePath("/pantry");
    return { success: true, count: results.length };
  } catch (error) {
    console.error("Bulk Add Error:", error);
    return { success: false, error: "Failed to add items." };
  }
}
