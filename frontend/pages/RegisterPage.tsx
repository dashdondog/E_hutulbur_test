"use client";

import { useState } from "react";
import { useAuth } from "@/frontend/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, GraduationCap, BookMarked } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, role);
      if (role === "student") {
        router.push("/student");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-md p-8 border border-[var(--color-border)]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--color-primary)]/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-[var(--color-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Бүртгүүлэх</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Шинэ хэрэглэгч үүсгэх</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Нэр</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="Овог Нэр"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Имэйл</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="example@mail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Нууц үг</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="6+ тэмдэгт"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Төрөл</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`py-3 rounded-lg text-sm font-medium border-2 transition-colors ${
                  role === "student"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]"
                }`}
              >
                <GraduationCap size={16} className="inline-block mr-1.5 -mt-0.5" />
                Суралцагч
              </button>
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`py-3 rounded-lg text-sm font-medium border-2 transition-colors ${
                  role === "teacher"
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]"
                }`}
              >
                <BookMarked size={16} className="inline-block mr-1.5 -mt-0.5" />
                Багш
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-accent)] text-black py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-accent-dark)] transition-colors disabled:opacity-50"
          >
            {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-text-secondary)] mt-6">
          Бүртгэлтэй юу?{" "}
          <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline">
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}
