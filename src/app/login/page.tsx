'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl: "/dashboard",
        });

        if (result?.ok) {
            router.push("/");
        } else {
            alert("Invalid login credentials");
        }
    };

    return (
        <div className="relative flex flex-col min-h-screen items-center justify-center bg-blue">
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-blue p-8 shadow">
                <img src="/favicon.ico" alt="Logo" className="w-72 h-72 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-center">Pantry Sign In</h1>
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                    Sign In
                </button>
            </form>
            <p className="absolute bottom-16 text-x2 text-white">Your Pantry, Perfectly Remembered</p>
        </div>
    );
}