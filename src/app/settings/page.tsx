"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession({ required: true });
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleDarkMode() {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-700">PantryMonium</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <span className="text-sm text-gray-600">{session?.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="p-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <h2 className="text-2xl font-semibold mb-2 text-black">Settings</h2>
          <p className="text-gray-500">Manage your preferences.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="font-bold text-lg text-green-800 mb-4 border-b pb-2">Appearance</h3>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800">Dark Mode</span>
            <button
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                darkMode
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {darkMode ? "Disable" : "Enable"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}