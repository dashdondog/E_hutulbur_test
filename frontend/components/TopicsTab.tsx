"use client";

import { useState } from "react";
import { Topic } from "@/shared/types";
import * as store from "@/frontend/lib/store";

interface Props {
  subjectId: string;
  topics: Topic[];
  onUpdate: () => void;
}

const empty = { name: "", description: "", subtopicsText: "" };

export default function TopicsTab({ subjectId, topics, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function openNew() {
    setForm(empty);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(t: Topic) {
    setForm({
      name: t.name,
      description: t.description,
      subtopicsText: t.subtopics.join("\n"),
    });
    setEditId(t.id);
    setShowForm(true);
  }

  function save() {
    if (!form.name.trim()) return;
    const topic: Topic = {
      id: editId || crypto.randomUUID(),
      subjectId,
      name: form.name.trim(),
      description: form.description.trim(),
      subtopics: form.subtopicsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      order: editId
        ? topics.find((t) => t.id === editId)!.order
        : topics.length,
    };
    store.saveTopic(topic);
    setShowForm(false);
    setForm(empty);
    setEditId(null);
    onUpdate();
  }

  function remove(id: string) {
    if (!confirm("Энэ сэдвийг устгах уу?")) return;
    store.deleteTopic(id);
    onUpdate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Сэдвүүд</h2>
        <button
          onClick={openNew}
          className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          + Сэдэв нэмэх
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 mb-6">
          <h3 className="text-base font-semibold mb-4">
            {editId ? "Сэдэв засах" : "Шинэ сэдэв"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Сэдвийн нэр
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Жишээ: 1-р бүлэг - Кинематик"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Тайлбар
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Сэдвийн товч тайлбар..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Дэд сэдвүүд (мөр бүрт нэгийг бичнэ)
              </label>
              <textarea
                value={form.subtopicsText}
                onChange={(e) =>
                  setForm({ ...form, subtopicsText: e.target.value })
                }
                rows={5}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder={"Дэд сэдэв 1\nДэд сэдэв 2\nДэд сэдэв 3"}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={save}
                className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)]"
              >
                Хадгалах
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                }}
                className="bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-border)]"
              >
                Болих
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {topics.length === 0 && !showForm && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center text-[var(--color-text-muted)]">
          Сэдэв байхгүй байна. &quot;+ Сэдэв нэмэх&quot; товч дарна уу.
        </div>
      )}
      <div className="space-y-3">
        {topics.map((t, idx) => (
          <div
            key={t.id}
            className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--color-surface-alt)]"
              onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-medium text-[var(--color-text)]">{t.name}</h4>
                  {t.subtopics.length > 0 && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {t.subtopics.length} дэд сэдэв
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(t);
                  }}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] text-sm px-2 py-1"
                >
                  Засах
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(t.id);
                  }}
                  className="text-[var(--color-text-muted)] hover:text-red-600 text-sm px-2 py-1"
                >
                  Устгах
                </button>
                <span className="text-[var(--color-text-muted)] ml-2">
                  {expandedId === t.id ? "▲" : "▼"}
                </span>
              </div>
            </div>
            {expandedId === t.id && (
              <div className="border-t border-[var(--color-border-light)] p-4 bg-[var(--color-surface-alt)]/50">
                {t.description && (
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3">{t.description}</p>
                )}
                {t.subtopics.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-2 block">
                      Дэд сэдвүүд
                    </span>
                    <ul className="space-y-1">
                      {t.subtopics.map((sub, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-[var(--color-text)]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                          {sub}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
