"use client";

import { useSession, signOut } from 'next-auth/react';


export default function DashboardPage() {
    // session is required: true, so users are kicked out if they aren't logged in
    const { data: session } = useSession({ required: true });

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
                    <p className="text-gray-500">Welcome back to your smart pantry manager.</p>
                </div>
            </main>
        </div>
    );
}