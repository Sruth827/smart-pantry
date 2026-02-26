"use client"

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <h1 className="text-5xl font-extrabold text-green-700 mb-4">ShelfControl</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-md">
        The smart pantry manager for your home. Track inventory, get expiry alerts, and simplify your shopping.
      </p>

      <div className="flex gap-4">
        {/* This button manually takes them to your login page */}
        <Link
          href="/login"
          className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
        >
          Sign In
        </Link>

        <button className="px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
          Learn More
        </button>
      </div>
    </div>
  );
}
