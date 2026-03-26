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
        <h2 className="text-lg font-semibold text-slate-700">Сэдвүүд</h2>
        <button
          onClick={openNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Сэдэв нэмэх
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="text-base font-semibold mb-4">
            {editId ? "Сэдэв засах" : "Шинэ сэдэв"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Сэдвийн нэр
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Жишээ: 1-р бүлэг - Кинематик"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Тайлбар
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Сэдвийн товч тайлбар..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Дэд сэдвүүд (мөр бүрт нэгийг бичнэ)
              </label>
              <textarea
                value={form.subtopicsText}
                onChange={(e) =>
                  setForm({ ...form, subtopicsText: e.target.value })
                }
                rows={5}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={"Дэд сэдэв 1\nДэд сэдэв 2\nДэд сэдэв 3"}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={save}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Хадгалах
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                }}
                className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200"
              >
                Болих
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {topics.length === 0 && !showForm && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          Сэдэв байхгүй байна. &quot;+ Сэдэв нэмэх&quot; товч дарна уу.
        </div>
      )}
      <div className="space-y-3">
        {topics.map((t, idx) => (
          <div
            key={t.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
              onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-medium text-slate-800">{t.name}</h4>
                  {t.subtopics.length > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">
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
                  className="text-slate-400 hover:text-blue-600 text-sm px-2 py-1"
                >
                  Засах
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(t.id);
                  }}
                  className="text-slate-400 hover:text-red-600 text-sm px-2 py-1"
                >
                  Устгах
                </button>
                <span className="text-slate-300 ml-2">
                  {expandedId === t.id ? "▲" : "▼"}
                </span>
              </div>
            </div>
            {expandedId === t.id && (
              <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                {t.description && (
                  <p className="text-sm text-slate-600 mb-3">{t.description}</p>
                )}
                {t.subtopics.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                      Дэд сэдвүүд
                    </span>
                    <ul className="space-y-1">
                      {t.subtopics.map((sub, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
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
