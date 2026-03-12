"use client"

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F0EB] text-center p-6">
      <div className="relative w-full h-150 mb-2">
        <Image
          src="/Logo_Bottom.png" // Path relative to the public folder
          alt="ShelfControl Pantry Manager"
          fill
          className="object-contain object-center"
          priority
        />
      </div>
      <p className="text-xl text-[#4A5568] mb-6 max-w-md">
        The <strong>smart</strong> pantry manager for your home. Track inventory, get expiry alerts, and simplify your shopping.
      </p>

      <div className="flex gap-4">
        {/* This button manually takes them to your login page */}
        <Link
          href="/login"
          className="px-8 py-3 bg-[#4A6FA5] text-white rounded-lg font-semibold hover:bg-[#3d5c8a] transition-colors shadow-lg"
        >
          Sign In
        </Link>

        <button className="px-8 py-3 bg-white text-[#2D3748] border border-[#E2E8F0] rounded-lg font-semibold hover:bg-[#F5F0EB] transition-colors">
          Learn More
        </button>

        <Link
          href="/registration"
          className="px-8 py-3 bg-[#4A6FA5] text-white rounded-lg font-semibold hover:bg-[#3d5c8a] transition-colors shadow-lg"
        >
          Register Now
        </Link>
      </div>
    </div>
  );
}
