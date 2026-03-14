"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";

export default function ProfilePage() {
  const { data: session, status } = useSession({ required: true });
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [unitPref, setUnitPref] = useState("Metric");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: () => fetch("/api/profile").then((r) => r.json()),
    enabled: status === "authenticated",
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setUnitPref(profile.unitPref || "Metric");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    },
  });

  const handleInfoSave = () => {
    updateMutation.mutate({ fullName, unitPref });
  };

  const handlePasswordSave = () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    updateMutation.mutate({ currentPassword, newPassword });
  };

  if (status === "loading" || isLoading) {
    return <AppShell><div style={{ padding: "48px", textAlign: "center", color: "#4A5568" }}>Loading profile...</div></AppShell>;
  }

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: "1px solid #E2E8F0",
    borderRadius: "10px", fontSize: "14px", color: "#2D3748",
    background: "#fff", outline: "none", boxSizing: "border-box" as const,
  };

  const labelStyle = { display: "block" as const, fontSize: "13px", fontWeight: 600, color: "#2D3748", marginBottom: "6px" };

  return (
    <AppShell>
      <div style={{ padding: "40px 48px", maxWidth: "600px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#2D3748", margin: 0 }}>Profile</h1>
          <p style={{ color: "#4A5568", marginTop: "6px", fontSize: "15px" }}>
            Manage your account information and preferences.
          </p>
        </div>

        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: "10px", marginBottom: "20px",
            background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: message.type === "success" ? "#276749" : "#dc2626",
            fontSize: "14px", fontWeight: 500,
          }}>
            {message.type === "success" ? "✅ " : "⚠️ "}{message.text}
          </div>
        )}

        {/* Account Info */}
        <div style={{ background: "#fff", borderRadius: "14px", padding: "28px", border: "1px solid #E2E8F0", marginBottom: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#2D3748", margin: "0 0 20px" }}>Account Information</h2>
          
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
              placeholder="Your full name"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Email Address</label>
            <input
              value={profile?.email || ""}
              disabled
              style={{ ...inputStyle, background: "#F7FAFC", color: "#A0AEC0", cursor: "not-allowed" }}
            />
            <p style={{ fontSize: "12px", color: "#A0AEC0", marginTop: "4px" }}>Email cannot be changed.</p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Units of Measurement</label>
            <div style={{ display: "flex", gap: "10px" }}>
              {["Metric", "Imperial"].map((unit) => (
                <button
                  key={unit}
                  onClick={() => setUnitPref(unit)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "10px", fontSize: "14px",
                    fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    background: unitPref === unit ? "#4A6FA5" : "#F7FAFC",
                    color: unitPref === unit ? "#fff" : "#374151",
                    border: `2px solid ${unitPref === unit ? "#4A6FA5" : "#E2E8F0"}`,
                  }}
                >
                  {unit === "Metric" ? "🌍 Metric (kg, L)" : "🇺🇸 Imperial (lbs, oz)"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleInfoSave}
            disabled={updateMutation.isPending}
            style={{
              width: "100%", padding: "11px", borderRadius: "10px",
              background: "#4A6FA5", color: "#fff", fontWeight: 700,
              fontSize: "14px", border: "none", cursor: "pointer",
            }}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Change Password */}
        <div style={{ background: "#fff", borderRadius: "14px", padding: "28px", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#2D3748", margin: "0 0 20px" }}>Change Password</h2>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={inputStyle}
              placeholder="Enter current password"
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              placeholder="At least 8 characters"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              placeholder="Repeat new password"
            />
          </div>

          <button
            onClick={handlePasswordSave}
            disabled={updateMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
            style={{
              width: "100%", padding: "11px", borderRadius: "10px",
              background: "#2D3748", color: "#fff", fontWeight: 700,
              fontSize: "14px", border: "none", cursor: "pointer",
              opacity: (!currentPassword || !newPassword || !confirmPassword) ? 0.5 : 1,
            }}
          >
            {updateMutation.isPending ? "Updating..." : "Update Password"}
          </button>
        </div>

        {/* Account info footer */}
        <div style={{ marginTop: "16px", padding: "12px 16px", background: "#F7FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
          <p style={{ fontSize: "12px", color: "#A0AEC0", margin: 0 }}>
            Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
