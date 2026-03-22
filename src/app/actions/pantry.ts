"use server";
import { revalidatePath } from "next/cache";
import { db } from '@/lib/db';
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";


export async function createPantryItem(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  console.log("🛠️ SERVER SESSION CHECK:", session?.user);
  if (!session?.user?.id) {
    console.log("❌ SESSION FAILED - USER ID MISSING");
    return { success: false, error: "Unauthorized" };
  }

  const itemName = formData.get("itemName") as string;
  const quantity = parseFloat(formData.get("quantity") as string) || 1;
  const unitLabel = formData.get("unitLabel") as string || "pcs";
  const categoryId = formData.get("categoryId") as string;
  const expirationDate = formData.get("expirationDate") as string;
  const notes = (formData.get("notes") as string) || null;

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
    let inheritedThreshold = 0;
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

  } catch (error) {
    console.error("POST Error:", error);
    return { success: false, error: "Database save failed." };
  }
}



export async function processScannedBarcode(upc: string, categoryId? : string){
  console.log("Server Action: Processing UPC", upc);
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id; 
  // 2. Security Check: If no session, reject the request
  if (!session || !session.user) {
    console.log("Auth Error: No session user ID found");
    return { success: false, error: "You must be logged in to add items." };
  }

  const API_KEY = process.env.SPOONACULAR_API_KEY;

  try {
    const response = await fetch(
      `https://api.spoonacular.com/food/products/upc/${upc}?apiKey=${API_KEY}`
    );

    console.log("Spoonacular Response Status:", response.status);
    if (!response.ok) throw new Error("Product not found");
    const data = await response.json();
    console.log("Data received:", data.title);
    const { title, ingredientId } = data;

    if (!categoryId) {
      return {
        success: true,
        item: { itemName: title, spoonacularId: ingredientId }
      };
    }

    // Save to Prisma Database
    const newItem = await db.pantryItem.create({
      data: {
        itemName: title,
        spoonacularId: ingredientId, 
        quantity: 1,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { connect: { email: session.user.email as string} },
        category: { connect: { id: categoryId } }
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
      }
      };
  } catch (error) {
    console.error("Prisma/Fetch Error:", error);
    return { success: false, error: "Could not find or save item." };    

  }
}


export async function deletePantryItem(itemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await db.pantryItem.delete({
      where: {
        id: itemId,
        userId: session.user.id // Critical security check!
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
