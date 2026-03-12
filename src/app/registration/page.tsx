"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Registration failed');
            }

            // SUCCESS: Auto-login the user
            const loginRes = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (loginRes?.error) {
                router.push('/login'); // Fallback if auto-login fails
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F0EB] px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-[#4A6FA5]">ShelfControl</h2>
                    <p className="mt-2 text-sm text-[#4A5568]">Create your smart pantry account</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#2D3748]">Full Name</label>
                            <input
                                type="text"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-[#E2E8F0] placeholder-[#A0AEC0] text-[#2D3748] rounded-md focus:outline-none focus:ring-[#4A6FA5] focus:border-[#4A6FA5] sm:text-sm"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#2D3748]">Email Address</label>
                            <input
                                type="email"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-[#E2E8F0] placeholder-[#A0AEC0] text-[#2D3748] rounded-md focus:outline-none focus:ring-[#4A6FA5] focus:border-[#4A6FA5] sm:text-sm"
                                placeholder="your@email.here"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#2D3748]">Password</label>
                            <input
                                type="password"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-[#E2E8F0] placeholder-[#A0AEC0] text-[#2D3748] rounded-md focus:outline-none focus:ring-[#4A6FA5] focus:border-[#4A6FA5] sm:text-sm"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#4A6FA5] hover:bg-[#3d5c8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A6FA5] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <Link href="/login" className="font-medium text-[#4A6FA5] hover:text-[#3d5c8a]">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
