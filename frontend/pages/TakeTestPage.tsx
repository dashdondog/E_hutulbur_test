"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { subjects } from "@/shared/subjects";
import { Test } from "@/shared/types";
import { useAuth } from "@/frontend/lib/auth-context";
import * as store from "@/frontend/lib/store";

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;
  const testId = params.testId as string;

  const { user } = useAuth();
  const subject = subjects.find((s) => s.id === subjectId);
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Map<string, number | string>>(
    new Map()
  );
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = store.getTestById(testId);
    if (t) {
      setTest(t);
      setTimeLeft(t.duration * 60);
    }
  }, [testId]);

  const handleSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);

    // Save result to MongoDB (students only)
    if (test && user && user.role === "student") {
      let correct = 0;
      let earned = 0;
      let total = 0;
      test.questions.forEach((q) => {
        total += q.points;
        if (q.type !== "open" && answers.get(q.id) === q.correctAnswer) {
          correct++;
          earned += q.points;
        }
      });
      fetch("/api/test-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: test.id,
          subjectId,
          topicName: test.topicName,
          testName: test.name,
          correctCount: correct,
          totalQuestions: test.questions.filter((q) => q.type !== "open").length,
          earnedPoints: earned,
          totalPoints: total,
          percentage: total > 0 ? Math.round((earned / total) * 100) : 0,
        }),
      }).catch(() => {});
    }
  }, [test, user, answers, subjectId]);

  useEffect(() => {
    if (!test || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test, submitted, handleSubmit]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function setAnswer(questionId: string, value: number | string) {
    setAnswers(new Map(answers.set(questionId, value)));
  }

  if (!test || !subject) {
    return (
      <div className="p-8 text-center text-[var(--color-text-secondary)]">Тест олдсонгүй</div>
    );
  }

  // Calculate results
  let correctCount = 0;
  let totalPoints = 0;
  let earnedPoints = 0;
  if (submitted) {
    test.questions.forEach((q) => {
      totalPoints += q.points;
      if (q.type !== "open") {
        const answer = answers.get(q.id);
        if (answer === q.correctAnswer) {
          correctCount++;
          earnedPoints += q.points;
        }
      }
    });
  }

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">{test.name}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
              <span className="text-xs sm:text-sm text-[var(--color-text-secondary)]">{subject.name}</span>
              <span className="bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-xs font-medium px-2 py-0.5 rounded-full">
                {test.topicName}
              </span>
              <span className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                {test.questions.length} асуулт
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {!submitted && (
              <div
                className={`text-xl sm:text-2xl font-mono font-bold ${
                  timeLeft < 60
                    ? "text-red-600 animate-pulse"
                    : timeLeft < 300
                    ? "text-orange-500"
                    : "text-[var(--color-text)]"
                }`}
              >
                {formatTime(timeLeft)}
              </div>
            )}
            <button
              onClick={() => router.push(`/subjects/${subjectId}`)}
              className="bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-border)]"
            >
              Буцах
            </button>
          </div>
        </div>

        {/* Results banner */}
        {submitted && (
          <div
            className={`rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 ${
              percentage >= 80
                ? "bg-green-500/10 border border-green-500/20"
                : percentage >= 60
                ? "bg-yellow-500/10 border border-yellow-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  Шалгалтын дүн
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {correctCount} / {test.questions.filter((q) => q.type !== "open").length} зөв
                  хариулт
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-3xl sm:text-4xl font-bold ${
                    percentage >= 80
                      ? "text-green-600"
                      : percentage >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {percentage}%
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {earnedPoints} / {totalPoints} оноо
                </p>
              </div>
            </div>
            <div className="w-full bg-[var(--color-surface-alt)] rounded-full h-3 mt-4">
              <div
                className={`h-3 rounded-full transition-all ${
                  percentage >= 80
                    ? "bg-green-500"
                    : percentage >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {test.questions.map((q, idx) => {
            const userAnswer = answers.get(q.id);
            const isCorrect =
              submitted && q.type !== "open" && userAnswer === q.correctAnswer;
            const isWrong =
              submitted &&
              q.type !== "open" &&
              userAnswer !== undefined &&
              userAnswer !== q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`bg-[var(--color-surface)] rounded-xl border p-3 sm:p-5 ${
                  submitted
                    ? isCorrect
                      ? "border-green-300 bg-green-50/50"
                      : isWrong
                      ? "border-red-300 bg-red-50/50"
                      : "border-[var(--color-border)]"
                    : "border-[var(--color-border)]"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">
                    <span className="text-[var(--color-primary)] mr-2">#{idx + 1}</span>
                    {q.text}
                  </h3>
                  <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap ml-4">
                    {q.points} оноо
                  </span>
                </div>

                {q.type === "multiple" && (
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswer === optIdx;
                      const isCorrectOption = q.correctAnswer === optIdx;
                      let optClass =
                        "border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm cursor-pointer transition-colors";

                      if (submitted) {
                        if (isCorrectOption) {
                          optClass =
                            "border-2 border-green-500 bg-green-50 rounded-lg px-4 py-2.5 text-sm font-medium text-green-800";
                        } else if (isSelected && !isCorrectOption) {
                          optClass =
                            "border-2 border-red-400 bg-red-50 rounded-lg px-4 py-2.5 text-sm text-red-700 line-through";
                        } else {
                          optClass =
                            "border border-[var(--color-border-light)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text-muted)]";
                        }
                      } else {
                        if (isSelected) {
                          optClass =
                            "border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10 rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--color-primary)]";
                        } else {
                          optClass += " hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5";
                        }
                      }

                      return (
                        <div
                          key={optIdx}
                          className={optClass}
                          onClick={() => !submitted && setAnswer(q.id, optIdx)}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === "truefalse" && (
                  <div className="flex gap-3">
                    {["Үнэн", "Худал"].map((label, i) => {
                      const isSelected = userAnswer === i;
                      const isCorrectOption = q.correctAnswer === i;
                      let btnClass =
                        "flex-1 py-3 rounded-lg text-sm font-medium border transition-colors cursor-pointer text-center";

                      if (submitted) {
                        if (isCorrectOption) {
                          btnClass += " border-green-500 bg-green-50 text-green-800 border-2";
                        } else if (isSelected) {
                          btnClass += " border-red-400 bg-red-50 text-red-700 border-2";
                        } else {
                          btnClass += " border-[var(--color-border-light)] text-[var(--color-text-muted)]";
                        }
                      } else {
                        if (isSelected) {
                          btnClass += " border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-2";
                        } else {
                          btnClass += " border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5";
                        }
                      }

                      return (
                        <div
                          key={i}
                          className={btnClass}
                          onClick={() => !submitted && setAnswer(q.id, i)}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === "open" && (
                  <textarea
                    rows={3}
                    disabled={submitted}
                    value={(userAnswer as string) || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:bg-[var(--color-surface-alt)]"
                    placeholder="Хариултаа бичнэ үү..."
                  />
                )}

                {submitted && isWrong && q.type !== "open" && (
                  <p className="text-xs text-green-600 mt-2">
                    Зөв хариулт:{" "}
                    {q.type === "multiple"
                      ? `${String.fromCharCode(65 + q.correctAnswer)}. ${q.options[q.correctAnswer]}`
                      : q.correctAnswer === 0
                      ? "Үнэн"
                      : "Худал"}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        {!submitted && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSubmit}
              className="bg-[var(--color-accent)] text-black px-8 py-3 rounded-xl text-base font-semibold hover:bg-[var(--color-accent-dark)] transition-colors shadow-lg shadow-[var(--color-accent)]/20"
            >
              Шалгах
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
