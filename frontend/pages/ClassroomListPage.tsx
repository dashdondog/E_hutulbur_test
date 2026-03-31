"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, Copy, Check, Trash2 } from "lucide-react";
import { subjects } from "@/shared/subjects";
import { useAuth } from "@/frontend/lib/auth-context";

interface ClassroomItem {
  _id: string;
  name: string;
  subjectId?: string;
  joinCode: string;
  memberCount: number;
  createdAt: string;
}

export default function ClassroomListPage() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const availableSubjects = user?.teacherSubjects?.length
    ? subjects.filter((s) => user.teacherSubjects!.includes(s.id))
    : subjects;

  const loadClassrooms = () => {
    fetch("/api/classrooms")
      .then((r) => r.json())
      .then((d) => setClassrooms(d.classrooms || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClassrooms(); }, []);

  async function handleCreate() {
    if (!newName.trim() || !newSubjectId) return;
    setCreating(true);
    await fetch("/api/classrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), subjectId: newSubjectId }),
    });
    setNewName("");
    setNewSubjectId("");
    setShowCreate(false);
    setCreating(false);
    loadClassrooms();
  }

  async function handleDelete(id: string) {
    if (!confirm("Энэ ангийг устгах уу?")) return;
    await fetch(`/api/classrooms/${id}`, { method: "DELETE" });
    loadClassrooms();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function getSubjectName(subjectId?: string) {
    return subjects.find((s) => s.id === subjectId)?.name ?? "";
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Миний ангиуд</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Анги үүсгэж сурагчдаа нэгтгээрэй</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Анги үүсгэх
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">Шинэ анги үүсгэх</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Хичээл</label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] text-sm"
                    autoFocus
                  >
                    <option value="">Хичээл сонгох...</option>
                    {availableSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Ангийн нэр</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Жишээ: 11А"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] rounded-lg">
                  Болих
                </button>
                <button onClick={handleCreate} disabled={creating || !newName.trim() || !newSubjectId} className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
                  {creating ? "Үүсгэж байна..." : "Үүсгэх"}
                </button>
              </div>
            </div>
          </div>
        )}

        {classrooms.length === 0 ? (
          <div className="text-center py-16 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            <Users size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
            <p className="text-[var(--color-text-secondary)]">Анги үүсгээгүй байна</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">&ldquo;Анги үүсгэх&rdquo; товч дарж эхлээрэй</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {classrooms.map((c) => (
              <div key={c._id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/30 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <Link href={`/classrooms/${c._id}`} className="text-lg font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)]">
                    {c.name}
                  </Link>
                  <button onClick={() => handleDelete(c._id)} className="text-[var(--color-text-muted)] hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>

                {c.subjectId && (
                  <p className="text-sm text-[var(--color-primary)] font-medium mb-3">{getSubjectName(c.subjectId)}</p>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-[var(--color-text-muted)]">Код:</span>
                  <code className="bg-[var(--color-surface-alt)] px-2 py-0.5 rounded text-sm font-mono font-bold text-[var(--color-primary)]">
                    {c.joinCode}
                  </code>
                  <button onClick={() => copyCode(c.joinCode)} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                    {copiedCode === c.joinCode ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {c.memberCount} сурагч
                  </span>
                </div>

                <Link
                  href={`/classrooms/${c._id}`}
                  className="mt-3 block text-center text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 py-2 rounded-lg transition-colors"
                >
                  Дэлгэрэнгүй →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
