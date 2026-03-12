import Scanner from "@/components/scanner";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ScanPage() {
  const session = await getServerSession(authOptions);
  
  const categories = await db.category.findMany({
    where: { userId: session?.user?.id },
    select: { id: true, name: true }
  });

  return (
    <div className="min-h-screen bg-[#F5F0EB] py-12">
      <Scanner categories={categories} />
    </div>
  );
}