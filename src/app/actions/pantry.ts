"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function addPantryItem(formData: FormData) {
  const itemName = formData.get("itemName") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const userId = "your-current-user-uuid"; // We'll replace this with Auth later

  await prisma.pantryItem.create({
    data: { itemName, quantity, userId },
  });

  revalidatePath("/"); // Refreshes the "Pantry List" view automatically
}
