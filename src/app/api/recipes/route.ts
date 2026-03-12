import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const ingredients = searchParams.get("ingredients");
  if (!ingredients) return NextResponse.json({ error: "No ingredients provided" }, { status: 400 });

  const API_KEY = process.env.SPOONACULAR_API_KEY;
  if (!API_KEY) return NextResponse.json({ error: "Spoonacular API key not configured. Please add SPOONACULAR_API_KEY to your .env file." }, { status: 500 });

  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=12&ranking=1&ignorePantry=true&apiKey=${API_KEY}`
    );
    if (!res.ok) throw new Error("Spoonacular API error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch recipes" }, { status: 500 });
  }
}
