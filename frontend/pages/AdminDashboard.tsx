"use client";

import { useState, useEffect } from "react";
import { Trash2, Users, BookOpen, GraduationCap, ShieldCheck } from "lucide-react";

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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Админ хяналт</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Системийн бүх хэрэглэгчдийн удирдлага</p>
          </div>
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
                      <button
                        onClick={() => handleDelete(u._id, u.name)}
                        className="text-[var(--color-text-muted)] hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
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
