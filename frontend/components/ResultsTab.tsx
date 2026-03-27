"use client";

import { useState, useEffect } from "react";
import { TestResult } from "@/shared/types";

interface Props {
  subjectId: string;
}

export default function ResultsTab({ subjectId }: Props) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTest, setFilterTest] = useState<string>("all");

  useEffect(() => {
    fetch(`/api/test-results?subjectId=${subjectId}`)
      .then((res) => res.json())
      .then((data) => setResults(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Get unique test names for filter
  const testNames = [...new Set(results.map((r) => r.testName))];

  const filtered = filterTest === "all" ? results : results.filter((r) => r.testName === filterTest);

  // Group by student
  const byStudent = new Map<string, TestResult[]>();
  filtered.forEach((r) => {
    const arr = byStudent.get(r.userName) || [];
    arr.push(r);
    byStudent.set(r.userName, arr);
  });

  // Stats
  const avgScore = filtered.length > 0
    ? Math.round(filtered.reduce((s, r) => s + r.percentage, 0) / filtered.length)
    : 0;
  const passCount = filtered.filter((r) => r.percentage >= 60).length;
  const uniqueStudents = new Set(filtered.map((r) => r.userName)).size;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Сурагчдын дүнгүүд</h2>
        <select
          value={filterTest}
          onChange={(e) => setFilterTest(e.target.value)}
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="all">Бүх тест</option>
          {testNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Нийт дүн" value={String(filtered.length)} color="slate" />
        <StatCard label="Сурагчид" value={String(uniqueStudents)} color="blue" />
        <StatCard label="Дундаж оноо" value={`${avgScore}%`} color={avgScore >= 60 ? "green" : "red"} />
        <StatCard label="Тэнцсэн" value={`${passCount}/${filtered.length}`} color="green" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center text-[var(--color-text-muted)]">
          Сурагч тест өгөөгүй байна.
        </div>
      ) : (
        <>
          {/* Results table */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]">
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Сурагч</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Тест</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Сэдэв</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Зөв/Нийт</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Оноо</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Хувь</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Огноо</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} className={`border-b border-[var(--color-border-light)] ${i % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface-alt)]/50"}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">
                          {r.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-[var(--color-text)]">{r.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text)]">{r.testName}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] text-xs">{r.topicName}</td>
                    <td className="px-4 py-3 text-center text-[var(--color-text-secondary)]">
                      {r.correctCount}/{r.totalQuestions}
                    </td>
                    <td className="px-4 py-3 text-center text-[var(--color-text-secondary)]">
                      {r.earnedPoints}/{r.totalPoints}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        r.percentage >= 70
                          ? "bg-green-500/10 text-green-500"
                          : r.percentage >= 40
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-[var(--color-text-muted)]">
                      {new Date(r.submittedAt).toLocaleDateString("mn-MN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Per-student summary */}
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mt-6 mb-3">Сурагч тус бүрийн нэгтгэл</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from(byStudent.entries()).map(([name, studentResults]) => {
              const avg = Math.round(studentResults.reduce((s, r) => s + r.percentage, 0) / studentResults.length);
              const best = Math.max(...studentResults.map((r) => r.percentage));
              return (
                <div key={name} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text)]">{name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{studentResults.length} тест өгсөн</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-text-muted)]">Дундаж</p>
                      <p className={`text-sm font-bold ${avg >= 60 ? "text-green-600" : "text-red-600"}`}>{avg}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-text-muted)]">Шилдэг</p>
                      <p className="text-sm font-bold text-[var(--color-primary)]">{best}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    slate: "text-[var(--color-text)]",
    blue: "text-[var(--color-primary)]",
    green: "text-green-600",
    red: "text-red-600",
  };
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
      <p className="text-xs text-[var(--color-text-muted)] uppercase">{label}</p>
      <p className={`text-2xl font-bold ${colors[color] || "text-[var(--color-text)]"}`}>{value}</p>
    </div>
  );
}
