'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const result = await signIn("credentials", {
            email, password, redirect: false, callbackUrl: "/dashboard",
        });
        if (result?.ok) router.push("/dashboard");
        else setError("Invalid email or password. Please try again.");
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "var(--background)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        }}>
            <div style={{
                width: "100%", maxWidth: "420px",
                background: "var(--card-bg)", borderRadius: "20px",
                boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
                border: "1px solid var(--card-border)", overflow: "hidden",
            }}>
                {/* Logo section */}
                <div style={{
                    background: "#2D3748",
                    padding: "36px 32px 28px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Image src="/Logo_Bottom.png" alt="PantryMonium" width={200} height={200} style={{ objectFit: "contain" }} priority />
                </div>

                {/* Form section */}
                <div style={{ padding: "32px" }}>
                    <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--foreground)", margin: "0 0 6px" }}>
                        Welcome back
                    </h1>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 24px" }}>
                        Sign in to your pantry account
                    </p>

                    {error && (
                        <div style={{
                            padding: "10px 14px", borderRadius: "8px", marginBottom: "16px",
                            background: "var(--alert-expired-bg)", border: "1px solid var(--alert-expired-border)",
                            color: "var(--alert-expired-text)", fontSize: "13px",
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-body)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Email Address
                            </label>
                            <input
                                type="email" placeholder="you@example.com"
                                value={email} onChange={(e) => setEmail(e.target.value)} required
                                style={{
                                    width: "100%", padding: "10px 14px", border: "1px solid var(--input-border)",
                                    borderRadius: "10px", fontSize: "14px", color: "var(--input-color)",
                                    background: "var(--input-bg)", outline: "none", boxSizing: "border-box",
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-body)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Password
                            </label>
                            <input
                                type="password" placeholder="••••••••"
                                value={password} onChange={(e) => setPassword(e.target.value)} required
                                style={{
                                    width: "100%", padding: "10px 14px", border: "1px solid var(--input-border)",
                                    borderRadius: "10px", fontSize: "14px", color: "var(--input-color)",
                                    background: "var(--input-bg)", outline: "none", boxSizing: "border-box",
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; }}
                            />
                        </div>

                        <button
                            type="submit" disabled={loading}
                            style={{
                                marginTop: "6px", width: "100%", padding: "12px",
                                borderRadius: "10px", fontSize: "15px", fontWeight: 700,
                                background: loading ? "#93b4d4" : "var(--brand)",
                                color: "#fff", border: "none",
                                cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#3d5c8a"; }}
                            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "var(--brand)"; }}
                        >
                            {loading ? "Signing in…" : "Sign In"}
                        </button>
                    </form>

                    <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
                        Don&apos;t have an account?{" "}
                        <a href="/registration" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
                        >
                            Create one
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
