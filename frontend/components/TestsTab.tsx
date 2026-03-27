"use client";

import { useState } from "react";
import { Topic, Test, Question } from "@/shared/types";
import * as store from "@/frontend/lib/store";
import Link from "next/link";

interface Props {
  subjectId: string;
  topics: Topic[];
  tests: Test[];
  onUpdate: () => void;
}

function emptyQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    text: "",
    type: "multiple",
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 1,
  };
}

export default function TestsTab({ subjectId, topics, tests, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>("all");
  const [testName, setTestName] = useState("");
  const [testTopicId, setTestTopicId] = useState("");
  const [testDuration, setTestDuration] = useState(40);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  // Filter tests by topic
  const filteredTests =
    selectedTopicFilter === "all"
      ? tests
      : tests.filter((t) => t.topicId === selectedTopicFilter);

  // Group tests by topic
  const testsByTopic = new Map<string, Test[]>();
  filteredTests.forEach((t) => {
    const arr = testsByTopic.get(t.topicId) || [];
    arr.push(t);
    testsByTopic.set(t.topicId, arr);
  });

  function openNew() {
    setTestName("");
    setTestTopicId(topics.length > 0 ? topics[0].id : "");
    setTestDuration(40);
    setQuestions([emptyQuestion()]);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(test: Test) {
    setTestName(test.name);
    setTestTopicId(test.topicId);
    setTestDuration(test.duration);
    setQuestions(test.questions.map(q => ({ ...q, options: [...q.options] })));
    setEditId(test.id);
    setShowForm(true);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addQuestion() {
    setQuestions([...questions, emptyQuestion()]);
  }

  function removeQuestion(idx: number) {
    setQuestions(questions.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, updates: Partial<Question>) {
    setQuestions(
      questions.map((q, i) => (i === idx ? { ...q, ...updates } : q))
    );
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    const newQuestions = [...questions];
    const opts = [...newQuestions[qIdx].options];
    opts[optIdx] = value;
    newQuestions[qIdx] = { ...newQuestions[qIdx], options: opts };
    setQuestions(newQuestions);
  }

  function changeQuestionType(idx: number, type: Question["type"]) {
    const q = questions[idx];
    let options = q.options;
    if (type === "truefalse") {
      options = ["Үнэн", "Худал"];
    } else if (type === "multiple" && q.type === "truefalse") {
      options = ["", "", "", ""];
    } else if (type === "open") {
      options = [];
    }
    updateQuestion(idx, { type, options, correctAnswer: 0 });
  }

  function save() {
    if (!testName.trim() || !testTopicId) return;
    const validQuestions = questions.filter((q) => q.text.trim());
    if (validQuestions.length === 0) return;

    const topicName = topics.find((t) => t.id === testTopicId)?.name || "";
    const existing = editId ? tests.find(t => t.id === editId) : null;
    const test: Test = {
      id: editId || crypto.randomUUID(),
      subjectId,
      topicId: testTopicId,
      topicName,
      name: testName.trim(),
      duration: testDuration,
      questions: validQuestions,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    store.saveTest(test);
    setShowForm(false);
    setEditId(null);
    onUpdate();
  }

  function remove(id: string) {
    if (!confirm("Тест устгах уу?")) return;
    store.deleteTest(id);
    onUpdate();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Тестүүд</h2>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Topic filter */}
          <select
            value={selectedTopicFilter}
            onChange={(e) => setSelectedTopicFilter(e.target.value)}
            className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="all">Бүх сэдэв</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            onClick={openNew}
            disabled={topics.length === 0}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Тест үүсгэх
          </button>
        </div>
      </div>

      {topics.length === 0 && (
        <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl p-4 mb-4 text-sm text-[var(--color-accent)]">
          Тест үүсгэхийн тулд эхлээд &quot;Сэдвүүд&quot; табаас сэдэв нэмнэ үү.
        </div>
      )}

      {/* Test Create/Edit Form */}
      {showForm && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-6 mb-6">
          <h3 className="text-base font-semibold mb-4">{editId ? "Тест засах" : "Шинэ тест үүсгэх"}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Сэдэв
                </label>
                <select
                  value={testTopicId}
                  onChange={(e) => setTestTopicId(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Тестийн нэр
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="Жишээ: 1-р шалгалт"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Хугацаа (мин)
                </label>
                <input
                  type="number"
                  value={testDuration}
                  onChange={(e) => setTestDuration(Number(e.target.value))}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  min={1}
                />
              </div>
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">
                  Асуултууд ({questions.length})
                </h4>
                <button
                  onClick={addQuestion}
                  className="text-[var(--color-primary)] hover:text-[var(--color-primary)] text-sm font-medium"
                >
                  + Асуулт нэмэх
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-surface-alt)]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                        Асуулт #{qIdx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <select
                          value={q.type}
                          onChange={(e) =>
                            changeQuestionType(
                              qIdx,
                              e.target.value as Question["type"]
                            )
                          }
                          className="border border-[var(--color-border)] rounded px-2 py-1 text-xs"
                        >
                          <option value="multiple">Олон сонголттой</option>
                          <option value="truefalse">Үнэн/Худал</option>
                          <option value="open">Нээлттэй</option>
                        </select>
                        <input
                          type="number"
                          value={q.points}
                          onChange={(e) =>
                            updateQuestion(qIdx, {
                              points: Number(e.target.value),
                            })
                          }
                          className="w-16 border border-[var(--color-border)] rounded px-2 py-1 text-xs"
                          min={1}
                          title="Оноо"
                        />
                        <span className="text-xs text-[var(--color-text-muted)]">оноо</span>
                        {questions.length > 1 && (
                          <button
                            onClick={() => removeQuestion(qIdx)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            Устгах
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      value={q.text}
                      onChange={(e) =>
                        updateQuestion(qIdx, { text: e.target.value })
                      }
                      rows={2}
                      className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      placeholder="Асуултын текст..."
                    />

                    {q.type === "multiple" && (
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctAnswer === optIdx}
                              onChange={() =>
                                updateQuestion(qIdx, { correctAnswer: optIdx })
                              }
                              className="accent-[var(--color-primary)]"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) =>
                                updateOption(qIdx, optIdx, e.target.value)
                              }
                              className="flex-1 border border-[var(--color-border)] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                              placeholder={`Хариулт ${String.fromCharCode(
                                65 + optIdx
                              )}`}
                            />
                            {q.options.length > 2 && (
                              <button
                                onClick={() => {
                                  const newOpts = q.options.filter(
                                    (_, i) => i !== optIdx
                                  );
                                  const newCorrect =
                                    q.correctAnswer >= newOpts.length
                                      ? 0
                                      : q.correctAnswer;
                                  updateQuestion(qIdx, {
                                    options: newOpts,
                                    correctAnswer: newCorrect,
                                  });
                                }}
                                className="text-[var(--color-text-muted)] hover:text-red-500 text-xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        {q.options.length < 6 && (
                          <button
                            onClick={() => {
                              updateQuestion(qIdx, {
                                options: [...q.options, ""],
                              });
                            }}
                            className="text-[var(--color-primary)] text-xs hover:text-[var(--color-primary)]"
                          >
                            + Хариулт нэмэх
                          </button>
                        )}
                        <p className="text-xs text-[var(--color-primary)]">
                          Зөв хариултыг сонгоно уу (radio)
                        </p>
                      </div>
                    )}

                    {q.type === "truefalse" && (
                      <div className="flex gap-4">
                        {["Үнэн", "Худал"].map((label, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctAnswer === i}
                              onChange={() =>
                                updateQuestion(qIdx, { correctAnswer: i })
                              }
                              className="accent-[var(--color-primary)]"
                            />
                            {label}
                          </label>
                        ))}
                        <p className="text-xs text-[var(--color-primary)] ml-4">
                          Зөв хариултыг сонгоно уу
                        </p>
                      </div>
                    )}

                    {q.type === "open" && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Нээлттэй асуулт - сурагч өөрөө бичнэ
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={save}
                className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)]"
              >
                {editId ? "Хадгалах" : "Тест хадгалах"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-border)]"
              >
                Болих
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tests grouped by topic */}
      {filteredTests.length === 0 && !showForm && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center text-[var(--color-text-muted)]">
          {topics.length === 0
            ? "Эхлээд сэдэв нэмнэ үү"
            : "Тест байхгүй байна. \"+ Тест үүсгэх\" товч дарна уу."}
        </div>
      )}

      {selectedTopicFilter === "all" ? (
        // Show grouped by topic
        Array.from(testsByTopic.entries()).map(([topicId, topicTests]) => {
          const topic = topics.find((t) => t.id === topicId);
          return (
            <div key={topicId} className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                {topic?.name || "Тодорхойгүй сэдэв"}
                <span className="text-xs font-normal text-[var(--color-text-muted)]">
                  ({topicTests.length} тест)
                </span>
              </h3>
              <div className="space-y-2">
                {topicTests.map((test) => (
                  <TestCard
                    key={test.id}
                    test={test}
                    subjectId={subjectId}
                    onEdit={() => openEdit(test)}
                    onDelete={() => remove(test.id)}
                  />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="space-y-2">
          {filteredTests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              subjectId={subjectId}
              onEdit={() => openEdit(test)}
              onDelete={() => remove(test.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TestCard({
  test,
  subjectId,
  onEdit,
  onDelete,
}: {
  test: Test;
  subjectId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const totalPoints = test.questions.reduce((s, q) => s + q.points, 0);

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 hover:shadow-sm transition-shadow">
      <div>
        <h4 className="font-medium text-[var(--color-text)] text-sm sm:text-base">{test.name}</h4>
        <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-[var(--color-text-muted)]">
          <span>{test.questions.length} асуулт</span>
          <span>{totalPoints} оноо</span>
          <span>{test.duration} мин</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/subjects/${subjectId}/tests/${test.id}`}
          className="bg-[var(--color-accent)] text-black px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[var(--color-accent-dark)] transition-colors"
        >
          Тест өгөх
        </Link>
        <button
          onClick={onEdit}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] text-sm px-2 py-1"
        >
          Засах
        </button>
        <button
          onClick={onDelete}
          className="text-[var(--color-text-muted)] hover:text-red-600 text-sm px-2 py-1"
        >
          Устгах
        </button>
      </div>
    </div>
  );
}
