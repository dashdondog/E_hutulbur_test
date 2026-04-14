"use client";

import { useState } from "react";
import { useAuth } from "@/frontend/lib/auth-context";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, GraduationCap, BookOpen } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"intro" | "login">("intro");
  const [role, setRole] = useState<"teacher" | "student" | null>(null);
  // "login" | "register" — зөвхөн багшид хамаарна
  const [mode, setMode] = useState<"login" | "register">("login");

  // login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function selectRole(r: "teacher" | "student") {
    setRole(r);
    setMode("login");
    setStep("login");
    setError("");
  }

  function goBack() {
    setStep("intro");
    setError("");
    setEmail(""); setPassword("");
    setRegName(""); setRegEmail(""); setRegPassword(""); setRegConfirm("");
  }

  function switchMode(m: "login" | "register") {
    setMode(m);
    setError("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      const userRole = data.user?.role;
      if (userRole === "student") router.push("/student");
      else if (userRole === "admin") router.push("/admin");
      else router.push("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (regPassword !== regConfirm) {
      setError("Нууц үг таарахгүй байна");
      return;
    }
    if (regPassword.length < 6) {
      setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, role: "teacher" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Бүртгэл амжилтгүй");
      // auto login after register
      await login(regEmail, regPassword);
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">AI-EDU</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">11-р ангийн хичээлийн систем</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden">

          {/* ── Step 1: Role selector ── */}
          {step === "intro" && (
            <div className="p-8">
              <h2 className="text-lg font-semibold text-[var(--color-text)] text-center mb-2">Та хэн бэ?</h2>
              <p className="text-sm text-[var(--color-text-secondary)] text-center mb-8">Өөрийн эрхийг сонгоно уу</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => selectRole("teacher")}
                  className="group flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all"
                >
                  <div className="w-14 h-14 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center group-hover:bg-[var(--color-primary)]/20 transition-colors">
                    <BookOpen size={28} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[var(--color-text)]">Багш</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Хичээл заадаг</p>
                  </div>
                </button>

                <button
                  onClick={() => selectRole("student")}
                  className="group flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-all"
                >
                  <div className="w-14 h-14 bg-[var(--color-accent)]/10 rounded-2xl flex items-center justify-center group-hover:bg-[var(--color-accent)]/20 transition-colors">
                    <GraduationCap size={28} className="text-[var(--color-accent)]" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[var(--color-text)]">Сурагч</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Суралцдаг</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Teacher or Student form ── */}
          {step === "login" && (
            <div>
              {/* Header stripe */}
              <div className={`px-8 py-5 ${role === "teacher" ? "bg-[var(--color-primary)]" : "bg-[var(--color-accent)]"}`}>
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-3 transition-colors"
                >
                  <ArrowLeft size={14} /> Буцах
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {role === "teacher"
                      ? <BookOpen size={20} className="text-white" />
                      : <GraduationCap size={20} className="text-white" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {role === "teacher"
                        ? (mode === "login" ? "Багшийн нэвтрэлт" : "Багшийн бүртгэл")
                        : "Сурагчийн нэвтрэлт"}
                    </p>
                    <p className="text-xs text-white/70">
                      {role === "teacher"
                        ? (mode === "login" ? "Имэйлээрээ нэвтэрнэ үү" : "Шинэ бүртгэл үүсгэнэ үү")
                        : "Багшаас авсан кодоороо нэвтэрнэ үү"}
                    </p>
                  </div>
                </div>

                {/* Login / Register tabs — teacher only */}
                {role === "teacher" && (
                  <div className="flex gap-1 mt-4 bg-white/10 rounded-lg p-1">
                    <button
                      onClick={() => switchMode("login")}
                      className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        mode === "login" ? "bg-white text-[var(--color-primary)]" : "text-white/80 hover:text-white"
                      }`}
                    >
                      Нэвтрэх
                    </button>
                    <button
                      onClick={() => switchMode("register")}
                      className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        mode === "register" ? "bg-white text-[var(--color-primary)]" : "text-white/80 hover:text-white"
                      }`}
                    >
                      Бүртгүүлэх
                    </button>
                  </div>
                )}
              </div>

              {/* ── Login form ── */}
              {mode === "login" && (
                <form onSubmit={handleLogin} className="p-8 space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                      {role === "teacher" ? "Имэйл" : "Нэвтрэх код"}
                    </label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      placeholder={role === "teacher" ? "example@mail.com" : "S-XXXXXX"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Нууц үг</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                      role === "teacher"
                        ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                        : "bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-dark)]"
                    }`}>
                    {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
                  </button>
                </form>
              )}

              {/* ── Register form (teacher only) ── */}
              {mode === "register" && (
                <form onSubmit={handleRegister} className="p-8 space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Нэр</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      autoFocus
                      className="w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      placeholder="Овог нэр"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Имэйл</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      placeholder="example@mail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Нууц үг</label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        className="w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="••••••"
                      />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Нууц үг давтах</label>
                    <div className="relative">
                      <input
                        type={showRegConfirm ? "text" : "password"}
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        required
                        className="w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="••••••"
                      />
                      <button type="button" onClick={() => setShowRegConfirm(!showRegConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                        {showRegConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50">
                    {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
