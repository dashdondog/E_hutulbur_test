"use client";

import { useState, useEffect } from "react";
import { Trash2, Users, BookOpen, GraduationCap, ShieldCheck, UserPlus, Copy, X, Check, KeyRound } from "lucide-react";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: "teacher" | "student" | "admin";
  createdAt: string;
}

const roleLabel: Record<string, string> = {
  teacher: "Багш",
  student: "Сурагч",
  admin: "Админ",
};

const roleColor: Record<string, string> = {
  teacher: "bg-blue-500/10 text-blue-600",
  student: "bg-green-500/10 text-green-600",
  admin: "bg-purple-500/10 text-purple-600",
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "teacher" | "student" | "admin">("all");

  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [resetTarget, setResetTarget] = useState<UserItem | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(null);
  const [resetCopied, setResetCopied] = useState(false);

  const loadUsers = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`"${name}" хэрэглэгчийг устгах уу?`)) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    loadUsers();
  }

  function resetCreateForm() {
    setNewName("");
    setNewEmail("");
    setCreateError("");
  }

  function closeAddTeacher() {
    setShowAddTeacher(false);
    setCreatedCreds(null);
    setCopied(false);
    resetCreateForm();
  }

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Үүсгэж чадсангүй");
      setCreatedCreds({ email: data.user.email, password: data.tempPassword });
      resetCreateForm();
      loadUsers();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function copyCreds() {
    if (!createdCreds) return;
    const text = `Имэйл: ${createdCreds.email}\nНууц үг: ${createdCreds.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openReset(u: UserItem) {
    setResetTarget(u);
    setResetError("");
    setResetResult(null);
    setResetCopied(false);
  }

  function closeReset() {
    setResetTarget(null);
    setResetResult(null);
    setResetError("");
    setResetCopied(false);
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    setResetError("");
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetTarget._id}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Нууц үг солих амжилтгүй боллоо");
      setResetResult({ email: resetTarget.email, password: data.tempPassword });
    } catch (err) {
      setResetError((err as Error).message);
    } finally {
      setResetting(false);
    }
  }

  async function copyResetCreds() {
    if (!resetResult) return;
    const text = `Имэйл: ${resetResult.email}\nНууц үг: ${resetResult.password}`;
    await navigator.clipboard.writeText(text);
    setResetCopied(true);
    setTimeout(() => setResetCopied(false), 2000);
  }

  const teachers = users.filter((u) => u.role === "teacher");
  const students = users.filter((u) => u.role === "student");
  const admins = users.filter((u) => u.role === "admin");

  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">Админ хяналт</h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Системийн бүх хэрэглэгчдийн удирдлага</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddTeacher(true)}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            <UserPlus size={16} />
            Багш нэмэх
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <BookOpen size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text)]">{teachers.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Багш</p>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center">
              <GraduationCap size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text)]">{students.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Сурагч</p>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text)]">{users.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Нийт</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-[var(--color-surface-alt)] p-1 rounded-lg w-fit mb-4">
          {(["all", "teacher", "student", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filter === r
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] font-medium shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              {r === "all" ? "Бүгд" : roleLabel[r]}
              <span className="ml-1 text-xs opacity-60">
                ({r === "all" ? users.length : users.filter((u) => u.role === r).length})
              </span>
            </button>
          ))}
        </div>

        {/* Add Teacher modal */}
        {showAddTeacher && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeAddTeacher}>
            <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-md border border-[var(--color-border)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  {createdCreds ? "Багш үүсгэгдлээ" : "Шинэ багш нэмэх"}
                </h2>
                <button onClick={closeAddTeacher} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                  <X size={18} />
                </button>
              </div>

              {createdCreds ? (
                <div className="p-6 space-y-4">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Дараах нэвтрэх мэдээллийг багшид <strong>яг одоо</strong> дамжуулна уу. Энэ нууц үг дахин харагдахгүй.
                  </p>
                  <div className="bg-[var(--color-surface-alt)] rounded-lg p-4 space-y-2 font-mono text-sm">
                    <div>
                      <span className="text-[var(--color-text-muted)]">Имэйл:</span>{" "}
                      <span className="text-[var(--color-text)]">{createdCreds.email}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Нууц үг:</span>{" "}
                      <span className="text-[var(--color-text)] font-bold">{createdCreds.password}</span>
                    </div>
                  </div>
                  <button
                    onClick={copyCreds}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    {copied ? <><Check size={16} /> Хуулагдлаа</> : <><Copy size={16} /> Хуулах</>}
                  </button>
                  <button
                    onClick={closeAddTeacher}
                    className="w-full bg-[var(--color-surface-alt)] text-[var(--color-text)] py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-border)] transition-colors"
                  >
                    Хаах
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateTeacher} className="p-6 space-y-4">
                  {createError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                      {createError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Нэр</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      autoFocus
                      placeholder="Овог нэр"
                      className="w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Имэйл</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      placeholder="example@mail.com"
                      className="w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Системээс түр нууц үг автоматаар үүсгэгдэж танд харагдана. Багш эхний удаа нэвтэрснийхээ дараа нууц үгээ солих ёстой.
                  </p>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-[var(--color-primary)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                  >
                    {creating ? "Үүсгэж байна..." : "Үүсгэх"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Reset password modal */}
        {resetTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeReset}>
            <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-md border border-[var(--color-border)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  {resetResult ? "Шинэ нууц үг" : "Нууц үг сэргээх"}
                </h2>
                <button onClick={closeReset} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                  <X size={18} />
                </button>
              </div>

              {resetResult ? (
                <div className="p-6 space-y-4">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Дараах нэвтрэх мэдээллийг хэрэглэгчид <strong>яг одоо</strong> дамжуулна уу. Энэ нууц үг дахин харагдахгүй.
                  </p>
                  <div className="bg-[var(--color-surface-alt)] rounded-lg p-4 space-y-2 font-mono text-sm">
                    <div>
                      <span className="text-[var(--color-text-muted)]">Имэйл/Код:</span>{" "}
                      <span className="text-[var(--color-text)]">{resetResult.email}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Шинэ нууц үг:</span>{" "}
                      <span className="text-[var(--color-text)] font-bold">{resetResult.password}</span>
                    </div>
                  </div>
                  <button
                    onClick={copyResetCreds}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    {resetCopied ? <><Check size={16} /> Хуулагдлаа</> : <><Copy size={16} /> Хуулах</>}
                  </button>
                  <button
                    onClick={closeReset}
                    className="w-full bg-[var(--color-surface-alt)] text-[var(--color-text)] py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-border)] transition-colors"
                  >
                    Хаах
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {resetError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                      {resetError}
                    </div>
                  )}
                  <div className="bg-[var(--color-surface-alt)] rounded-lg p-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">Хэрэглэгч</p>
                    <p className="font-semibold text-[var(--color-text)] mt-0.5">{resetTarget.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">{resetTarget.email}</p>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Шинэ түр нууц үг үүсгэх үү? Хуучин нууц үг үйлчлэхгүй болно.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={closeReset}
                      className="flex-1 bg-[var(--color-surface-alt)] text-[var(--color-text)] py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-border)] transition-colors"
                    >
                      Болих
                    </button>
                    <button
                      onClick={handleResetPassword}
                      disabled={resetting}
                      className="flex-1 bg-[var(--color-primary)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                    >
                      {resetting ? "Үүсгэж байна..." : "Сэргээх"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-muted)]">Хэрэглэгч байхгүй</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">#</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Нэр</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Имэйл / Код</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Роль</th>
                  <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Огноо</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u._id} className="border-b border-[var(--color-border-light)] last:border-0 hover:bg-[var(--color-surface-alt)] transition-colors">
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{u.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColor[u.role]}`}>
                        {roleLabel[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("mn") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openReset(u)}
                          title="Нууц үг сэргээх"
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] p-1 transition-colors"
                        >
                          <KeyRound size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u._id, u.name)}
                          title="Устгах"
                          className="text-[var(--color-text-muted)] hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
