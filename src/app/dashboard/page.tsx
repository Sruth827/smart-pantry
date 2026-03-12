"use client";

import Link from "next/link";
import { useSession, signOut } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AddItemForm  from "@/components/addItemModal";
import DeleteButton from "@/components/DeleteButton";
import QuantityAdjuster from "@/components/QuantityAdjuster";
import { useState } from 'react';

export const dynamic = 'force-dynamic';


function getExpirationColor(date:any) {

  if (!date) return "bg-gray-50";

  const today = new Date();
  const exp = new Date(date);

  const diffDays = Math.ceil(
    (exp.getTime() - today.getTime()) /
    (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "bg-red-200";

  if (diffDays <= 5) return "bg-yellow-200";

  return "bg-green-100";
}

function PantryItem({ item, sessionEmail }: { item: any, sessionEmail: any }) {
  const queryClient = useQueryClient();
  const [expDate, setExpDate] = useState(
    item.expirationDate ? new Date(item.expirationDate).toISOString().split("T")[0] : ""
  );

  return (
    <li className={`flex justify-between items-center p-3 rounded-md ${getExpirationColor(expDate)}`}>
      <div>
        <span className="font-medium text-gray-800">{item.itemName}</span>
        {expDate && (
          <p className="text-xs text-gray-500">
            Expires: {new Date(expDate + 'T00:00:00').toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4 font-medium text-gray-800">
        <QuantityAdjuster itemId={item.id} currentQty={Number(item.quantity)} />
        <input
          type="date"
          className="border rounded-md p-2 text-sm text-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
          value={expDate}
          onChange={async (e) => {
    setExpDate(e.target.value);
    await fetch(`/api/pantry/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expirationDate: e.target.value }),
    });
    queryClient.invalidateQueries({ queryKey: ['pantry', sessionEmail] });
  }}
        />
        <DeleteButton itemId={item.id} />
      </div>
    </li>
  );
}

export default function DashboardPage() {
    // session is required: true, so users are kicked out if they aren't logged in
    const { data: session, status } = useSession({ required: true });
    const queryClient = useQueryClient(); 

    const { data, isLoading : itemsLoading, error } = useQuery({
        queryKey: ['pantry', session?.user?.email],
        queryFn: () => fetch('/api/pantry').then(res => res.json()),
        enabled: status === "authenticated", 
    });

    const { data: categories, isLoading: catsLoading } = useQuery({
        queryKey: ['categories', session?.user?.email],
        queryFn: () => fetch('/api/categories').then(res => res.json()),
        enabled: status === "authenticated",
    });

    if (status === "loading" || itemsLoading || catsLoading) {
        return <div className="p-8 text-center">Checking the shelves...</div>;
    }
    if (error) return <div>Oops! Something went wrong.</div>;


    return (
        <div className="min-h-screen bg-gray-50">
            {/* navigation bar */}
            <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-green-700">PantryMonium</h1>
                <div className="flex items-center gap-4">

                    <div className="flex justify-between items-center mb-6">
                       

                        <AddItemForm categories={categories || []} />
                            {/* The Scan Button */}
                            <Link 
                                href="/scan" 
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                            <span>Scan Barcode</span>
                            </Link>
                        </div>
                    
                    <span className="text-sm text-gray-600">{session?.user?.email}</span>
                    <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900"> 
                    Settings
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                        Log Out
                    </button>
                </div>
            </nav>

            {/* content */}
            <main className="p-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-2xl font-semibold mb-2 text-black">Pantry Dashboard</h2>
                    <p className="text-gray-500">Welcome back to your smart pantry manager, {session?.user?.name || 'Chef'}.</p>
                </div>
                <br></br>         
                <br></br>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.map((category: any) => (
                <section key={category.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                    <h3 className="font-bold text-lg text-green-800 mb-4 border-b pb-2">
                        {category.name}
                    </h3>
                
                    {category.items && category.items.length > 0 ? (
                        <ul className="space-y-3">
                            {[...category.items].sort((a: any, b: any) => {if (!a.expirationDate && !b.expirationDate) 
                            return a.itemName.localeCompare(b.itemName);if (!a.expirationDate) return 1; if (!b.expirationDate) return -1;
                            const dateDiff = new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
                             return dateDiff !== 0 ? dateDiff : a.itemName.localeCompare(b.itemName);
                            }).map((item: any) => (
                                <PantryItem key={item.id} item={item} sessionEmail={session?.user?.email} />
                            ))}
                        </ul>
                    ) : (
                    <p className="text-gray-400 text-sm italic py-4">This shelf is empty.</p>
                )}
                </section>
                    ))}
                </div>
            </main>
        </div>
    );
}