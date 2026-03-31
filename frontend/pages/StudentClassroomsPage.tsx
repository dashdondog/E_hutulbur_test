"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, LogIn } from "lucide-react";
import { subjects } from "@/shared/subjects";

interface StudentClassroom {
  _id: string;
  name: string;
  subjectId?: string;
  teacherName: string;
  assignmentCount?: number;
}

function getSubjectName(subjectId?: string) {
  return subjects.find((s) => s.id === subjectId)?.name ?? "";
}

export default function StudentClassroomsPage() {
  const [classrooms, setClassrooms] = useState<StudentClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const loadClassrooms = () => {
    fetch("/api/classrooms")
      .then((r) => r.json())
      .then((d) => setClassrooms(d.classrooms || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClassrooms(); }, []);

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setJoining(true);
    setError("");
    const res = await fetch("/api/classrooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode: joinCode.trim() }),
    });
    const data = await res.json();
    setJoining(false);
    if (!res.ok) {
      setError(data.error || "Алдаа гарлаа");
      return;
    }
    setJoinCode("");
    setShowJoin(false);
    loadClassrooms();
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
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Багшийн өгсөн кодоор ангид нэгдээрэй</p>
          </div>
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium"
          >
            <LogIn size={16} />
            Ангид нэгдэх
          </button>
        </div>

        {/* Join modal */}
        {showJoin && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowJoin(false)}>
            <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">Ангид нэгдэх</h2>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
                placeholder="6 оронтой код"
                maxLength={6}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] text-center text-lg font-mono tracking-widest mb-2"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setShowJoin(false)} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] rounded-lg">
                  Болих
                </button>
                <button onClick={handleJoin} disabled={joining || joinCode.length < 6} className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
                  {joining ? "Нэгдэж байна..." : "Нэгдэх"}
                </button>
              </div>
            </div>
          </div>
        )}

        {classrooms.length === 0 ? (
          <div className="text-center py-16 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            <Users size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
            <p className="text-[var(--color-text-secondary)]">Ямар нэг ангид нэгдээгүй байна</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Багшаасаа кодыг авч нэгдээрэй</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {classrooms.map((c) => (
              <Link
                key={c._id}
                href={`/student/classrooms/${c._id}`}
                className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/30 transition-colors block"
              >
                <h3 className="text-lg font-semibold text-[var(--color-text)]">{c.name}</h3>
                {c.subjectId && (
                  <p className="text-sm text-[var(--color-primary)] font-medium mt-0.5">{getSubjectName(c.subjectId)}</p>
                )}
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">Багш: {c.teacherName}</p>
                {c.assignmentCount !== undefined && (
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">{c.assignmentCount} даалгавар</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
