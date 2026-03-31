"use client";

import { useState, useEffect } from "react";
import { subjects } from "@/shared/subjects";
import { useAuth } from "@/frontend/lib/auth-context";
import SubjectIcon from "@/frontend/components/SubjectIcon";
import { Check, Settings } from "lucide-react";

export default function SettingsPage() {
  const { user, updateTeacherSubjects } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSelected(user?.teacherSubjects ?? []);
  }, [user?.teacherSubjects]);

  function toggleSubject(id: string) {
    setSaved(false);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSaved(false);
    setSelected(subjects.map((s) => s.id));
  }

  function clearAll() {
    setSaved(false);
    setSelected([]);
  }

  async function handleSave() {
    setSaving(true);
    await updateTeacherSubjects(selected);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const hasChanges =
    JSON.stringify(selected.slice().sort()) !==
    JSON.stringify((user?.teacherSubjects ?? []).slice().sort());

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center">
            <Settings size={20} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Тохиргоо</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Хичээлийн сонголт болон бусад тохиргоо</p>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Миний заадаг хичээлүүд</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-[var(--color-primary)] hover:underline"
              >
                Бүгдийг сонгох
              </button>
              <span className="text-[var(--color-border)]">|</span>
              <button
                onClick={clearAll}
                className="text-xs text-[var(--color-text-muted)] hover:underline"
              >
                Цуцлах
              </button>
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-5">
            Сонгосон хичээлүүд хажуу цэсэнд харагдана. Хэрэв нэг ч хичээл сонгоогүй бол бүгд харагдана.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {subjects.map((s) => {
              const isSelected = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-text)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                  <SubjectIcon icon={s.icon} color={isSelected ? "#007ba7" : "#9ca3af"} size="sm" />
                  <span className="text-center leading-tight">{s.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)]">
              {selected.length === 0
                ? "Хичээл сонгоогүй — бүгд харагдана"
                : `${selected.length} хичээл сонгогдсон`}
            </p>
            <button
              onClick={handleSave}
              disabled={saving || (!hasChanges && !saved)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
              }`}
            >
              {saved ? "Хадгалагдлаа ✓" : saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
