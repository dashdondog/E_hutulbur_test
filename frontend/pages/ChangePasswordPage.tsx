"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Шинэ нууц үг таарахгүй байна");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Алдаа гарлаа");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";
  const eyeClass = "absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]";

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center">
              <KeyRound size={20} className="text-[var(--color-primary)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Нууц үг солих</h1>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 text-sm">
              Нууц үг амжилттай солигдлоо!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Одоогийн нууц үг</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="••••••"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className={eyeClass}>
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Шинэ нууц үг</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className={inputClass}
                    placeholder="6+ тэмдэгт"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className={eyeClass}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Шинэ нууц үг давтах</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    className={inputClass}
                    placeholder="••••••"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className={eyeClass}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-accent)] text-black py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-accent-dark)] transition-colors disabled:opacity-50"
              >
                {loading ? "Хадгалж байна..." : "Нууц үг солих"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
