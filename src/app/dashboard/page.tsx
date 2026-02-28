"use client";

import { useSession, signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';


export default function DashboardPage() {
    // session is required: true, so users are kicked out if they aren't logged in
    const { data: session } = useSession({ required: true });
    const { data, isLoading, error } = useQuery({
        queryKey: ['pantry'],
        queryFn: () => fetch('/api/pantry').then(res => res.json())
    });

    if (isLoading) return <div>Checking the shelves...</div>;
    if (error) return <div>Oops! Something went wrong.</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* navigation bar */}
            <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-green-700">ShelfControl</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{session?.user?.email}</span>
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
                    <h2 className="text-2xl font-semibold mb-2">Pantry Dashboard</h2>
                    <p className="text-gray-500">Welcome back to your smart pantry manager, {session?.user?.name || 'Chef'}.</p>
                </div>
                <br></br>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.map((category: any) => (
                <section key={category.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                    <h3 className="font-bold text-lg text-green-800 mb-4 border-b pb-2">
                        {category.name}
                    </h3>
                
                    {category.items.length > 0 ? (
                        <ul className="space-y-3">
                            {category.items.map((item: any) => (
                                <li key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span className="font-medium text-gray-800">{item.itemName}</span>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                                        {Number(item.quantity)} {item.unitLabel}
                                    </span>
                                </li>
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