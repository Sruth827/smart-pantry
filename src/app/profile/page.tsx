"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useTheme } from "@/components/ThemeContext";
import type { Theme } from "@/components/ThemeContext";

export default function ProfilePage() {
  const { data: session, status } = useSession({ required: true });
  const { theme, setTheme } = useTheme();
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
    return <AppShell><div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-body)" }}>Loading profile...</div></AppShell>;
  }

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
    borderRadius: "10px", fontSize: "14px", color: "var(--foreground)",
    background: "var(--card-bg)", outline: "none", boxSizing: "border-box" as const,
  };

  const labelStyle = { display: "block" as const, fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "6px" };

  return (
    <AppShell>
      <div className="profile-container">
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Profile</h1>
          <p style={{ color: "var(--text-body)", marginTop: "6px", fontSize: "15px" }}>
            Manage your account information and preferences.
          </p>
        </div>

        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: "10px", marginBottom: "20px",
            background: message.type === "success" ? "var(--alert-low-bg)" : "var(--alert-expired-bg)",
            border: `1px solid ${message.type === "success" ? "var(--alert-low-border)" : "var(--alert-expired-border)"}`,
            color: message.type === "success" ? "var(--alert-low-text)" : "var(--alert-expired-text)",
            fontSize: "14px", fontWeight: 500,
          }}>
            {message.type === "success" ? "✅ " : "⚠️ "}{message.text}
          </div>
        )}

        {/* Account Info */}
        <div style={{ background: "var(--card-bg)", borderRadius: "14px", padding: "28px", border: "1px solid var(--border)", marginBottom: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)", margin: "0 0 20px" }}>Account Information</h2>
          
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
              style={{ ...inputStyle, background: "var(--surface-subtle)", color: "var(--text-secondary)", cursor: "not-allowed" }}
            />
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Email cannot be changed.</p>
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
                    background: unitPref === unit ? "var(--brand)" : "var(--surface-subtle)",
                    color: unitPref === unit ? "#fff" : "var(--text-body)",
                    border: `2px solid ${unitPref === unit ? "var(--brand)" : "var(--border)"}`,
                  }}
                >
                  {unit === "Metric" ? "🌍 Metric (kg, L)" : "Imperial (lbs, oz)"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleInfoSave}
            disabled={updateMutation.isPending}
            style={{
              width: "100%", padding: "11px", borderRadius: "10px",
              background: "var(--brand)", color: "#fff", fontWeight: 700,
              fontSize: "14px", border: "none", cursor: "pointer",
            }}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Themes */}
        <div style={{ background: "var(--card-bg)", borderRadius: "14px", padding: "28px", border: "1px solid var(--border)", marginBottom: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)", margin: "0 0 6px" }}>Themes</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 20px" }}>
            Choose how PantryMonium looks for you.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(
              [
                { value: "light",    label: "Light Mode", icon: "☀️",  desc: "Clean, bright interface" },
                { value: "dark",     label: "Dark Mode",  icon: "🌙",  desc: "Easy on the eyes at night" },
                { value: "midnight", label: "Midnight",   icon: "🌑",  desc: "Pure black & grey, zero blue" },
              ] as { value: Theme; label: string; icon: string; desc: string }[]
            ).map(({ value, label, icon, desc }) => {
              const isSelected = theme === value;
              return (
                <label
                  key={value}
                  onClick={() => setTheme(value)}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "14px 16px", borderRadius: "12px", cursor: "pointer",
                    border: `2px solid ${isSelected ? "var(--brand)" : "var(--border)"}`,
                    background: isSelected ? "var(--btn-edit-bg)" : "var(--surface-subtle)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--text-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  }}
                >
                  {/* Radio button */}
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${isSelected ? "var(--brand)" : "var(--text-secondary)"}`,
                    background: isSelected ? "var(--brand)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {isSelected && (
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />
                    )}
                  </div>

                  {/* Icon */}
                  <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>{icon}</span>

                  {/* Label + description */}
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "var(--brand)" : "var(--foreground)" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {desc}
                    </div>
                  </div>

                  {/* Active badge */}
                  {isSelected && (
                    <span style={{
                      marginLeft: "auto", padding: "3px 10px", borderRadius: "20px",
                      fontSize: "11px", fontWeight: 700, flexShrink: 0,
                      background: "var(--brand)", color: "#fff",
                    }}>
                      Active
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Change Password */}
        <div style={{ background: "var(--card-bg)", borderRadius: "14px", padding: "28px", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)", margin: "0 0 20px" }}>Change Password</h2>

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
              background: "var(--foreground)", color: "#fff", fontWeight: 700,
              fontSize: "14px", border: "none", cursor: "pointer",
              opacity: (!currentPassword || !newPassword || !confirmPassword) ? 0.5 : 1,
            }}
          >
            {updateMutation.isPending ? "Updating..." : "Update Password"}
          </button>
        </div>

        {/* Account info footer */}
        <div style={{ marginTop: "16px", padding: "12px 16px", background: "var(--surface-subtle)", borderRadius: "10px", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
            Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
