"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/frontend/lib/auth-context";
import { subjects } from "@/shared/subjects";
import { Test, TestResult } from "@/shared/types";
import * as store from "@/frontend/lib/store";
import Link from "next/link";
import SubjectIcon from "@/frontend/components/SubjectIcon";
import { ClipboardList, BarChart3, TrendingUp } from "lucide-react";
import StudentProgressChart from "@/frontend/components/StudentProgressChart";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [allTests, setAllTests] = useState<{ subjectId: string; tests: Test[] }[]>([]);
  const [activeTab, setActiveTab] = useState<"progress" | "tests" | "results">("progress");

  useEffect(() => {
    // Load all tests from localStorage
    const testsBySubject = subjects.map((s) => ({
      subjectId: s.id,
      tests: store.getTests(s.id),
    })).filter((s) => s.tests.length > 0);
    setAllTests(testsBySubject);

    // Load results from MongoDB
    fetch("/api/test-results")
      .then((res) => res.json())
      .then((data) => setResults(data.results || []))
      .catch(() => {});
  }, []);

  const totalTests = allTests.reduce((s, g) => s + g.tests.length, 0);
  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">
            Сайн байна уу, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">Суралцагчийн хяналтын самбар</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--color-surface-alt)] rounded-lg p-1 mb-4 sm:mb-6 w-full sm:w-fit overflow-x-auto">
          <button
            onClick={() => setActiveTab("progress")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "progress" ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm" : "text-[var(--color-text-secondary)]"
            }`}
          >
            <TrendingUp size={14} /> Ахиц дэвшил
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "tests" ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm" : "text-[var(--color-text-secondary)]"
            }`}
          >
            <ClipboardList size={14} /> Тестүүд ({totalTests})
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "results" ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm" : "text-[var(--color-text-secondary)]"
            }`}
          >
            <BarChart3 size={14} /> Миний дүнгүүд ({results.length})
          </button>
        </div>

        {/* Progress Tab */}
        {activeTab === "progress" && (
          <StudentProgressChart results={results} />
        )}

        {/* Tests Tab */}
        {activeTab === "tests" && (
          <div className="space-y-6">
            {allTests.length === 0 && (
              <div className="bg-[var(--color-surface)] rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center text-[var(--color-text-muted)]">
                Одоогоор тест байхгүй байна. Багш тест үүсгэсний дараа энд харагдана.
              </div>
            )}
            {allTests.map(({ subjectId, tests }) => {
              const subject = subjects.find((s) => s.id === subjectId);
              if (!subject) return null;
              return (
                <div key={subjectId}>
                  <div className="flex items-center gap-2 mb-3">
                    <SubjectIcon icon={subject.icon} color={subject.color} size="sm" />
                    <h3 className="text-base font-semibold text-[var(--color-text)]">{subject.name}</h3>
                    <span className="text-xs text-[var(--color-text-muted)]">({tests.length} тест)</span>
                  </div>
                  <div className="space-y-2">
                    {tests.map((test) => {
                      const myResult = results.find((r) => r.testId === test.id);
                      const totalPoints = test.questions.reduce((s, q) => s + q.points, 0);
                      return (
                        <div
                          key={test.id}
                          className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 hover:shadow-sm transition-shadow"
                        >
                          <div>
                            <h4 className="font-medium text-[var(--color-text)] text-sm sm:text-base">{test.name}</h4>
                            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-[var(--color-text-muted)]">
                              <span>{test.questions.length} асуулт</span>
                              <span>{totalPoints} оноо</span>
                              <span>{test.duration} мин</span>
                              {test.topicName && <span className="text-[var(--color-primary)]">{test.topicName}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {myResult && (
                              <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                                myResult.percentage >= 70
                                  ? "bg-green-500/10 text-green-500"
                                  : myResult.percentage >= 40
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-red-500/10 text-red-500"
                              }`}>
                                {myResult.percentage}%
                              </span>
                            )}
                            <Link
                              href={`/subjects/${subjectId}/tests/${test.id}`}
                              className="bg-[var(--color-accent)] text-black px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-[var(--color-accent-dark)] transition-colors"
                            >
                              {myResult ? "Дахин өгөх" : "Тест өгөх"}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <div>
            {results.length === 0 ? (
              <div className="bg-[var(--color-surface)] rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center text-[var(--color-text-muted)]">
                Та одоогоор тест өгөөгүй байна.
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((r, i) => {
                  const subject = subjects.find((s) => s.id === r.subjectId);
                  return (
                    <div
                      key={i}
                      className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {subject ? (
                          <SubjectIcon icon={subject.icon} color={subject.color} size="sm" />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-alt)] flex items-center justify-center">
                            <ClipboardList size={16} className="text-[var(--color-text-muted)]" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-[var(--color-text)]">{r.testName}</h4>
                          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-0.5">
                            <span>{subject?.name}</span>
                            <span>•</span>
                            <span>{r.topicName}</span>
                            <span>•</span>
                            <span>{new Date(r.submittedAt).toLocaleDateString("mn-MN")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-text-muted)]">{r.correctCount}/{r.totalQuestions} зөв</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{r.earnedPoints}/{r.totalPoints} оноо</p>
                        </div>
                        <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                          r.percentage >= 70
                            ? "bg-green-500/10 text-green-500"
                            : r.percentage >= 40
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {r.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
