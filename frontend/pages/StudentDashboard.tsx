"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/frontend/lib/auth-context";
import { subjects } from "@/shared/subjects";
import { TestResult } from "@/shared/types";
import SubjectIcon from "@/frontend/components/SubjectIcon";
import { ClipboardList, BarChart3, TrendingUp } from "lucide-react";
import StudentProgressChart from "@/frontend/components/StudentProgressChart";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [activeTab, setActiveTab] = useState<"progress" | "results">("progress");

  useEffect(() => {
    fetch("/api/test-results")
      .then((res) => res.json())
      .then((data) => setResults(data.results || []))
      .catch(() => {});
  }, []);

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
                            {r.topicName && <><span>•</span><span>{r.topicName}</span></>}
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
