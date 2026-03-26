"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { subjects } from "@/shared/subjects";
import { Test } from "@/shared/types";
import * as store from "@/frontend/lib/store";

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;
  const testId = params.testId as string;

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
  }, []);

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
      <div className="p-8 text-center text-slate-500">Тест олдсонгүй</div>
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
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{test.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-500">{subject.name}</span>
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {test.topicName}
              </span>
              <span className="text-sm text-slate-400">
                {test.questions.length} асуулт
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!submitted && (
              <div
                className={`text-2xl font-mono font-bold ${
                  timeLeft < 60
                    ? "text-red-600 animate-pulse"
                    : timeLeft < 300
                    ? "text-orange-500"
                    : "text-slate-700"
                }`}
              >
                {formatTime(timeLeft)}
              </div>
            )}
            <button
              onClick={() => router.push(`/subjects/${subjectId}`)}
              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200"
            >
              Буцах
            </button>
          </div>
        </div>

        {/* Results banner */}
        {submitted && (
          <div
            className={`rounded-xl p-6 mb-6 ${
              percentage >= 80
                ? "bg-green-50 border border-green-200"
                : percentage >= 60
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Шалгалтын дүн
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {correctCount} / {test.questions.filter((q) => q.type !== "open").length} зөв
                  хариулт
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-4xl font-bold ${
                    percentage >= 80
                      ? "text-green-600"
                      : percentage >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {percentage}%
                </div>
                <p className="text-sm text-slate-500">
                  {earnedPoints} / {totalPoints} оноо
                </p>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 mt-4">
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
                className={`bg-white rounded-xl border p-5 ${
                  submitted
                    ? isCorrect
                      ? "border-green-300 bg-green-50/50"
                      : isWrong
                      ? "border-red-300 bg-red-50/50"
                      : "border-slate-200"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    <span className="text-blue-600 mr-2">#{idx + 1}</span>
                    {q.text}
                  </h3>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                    {q.points} оноо
                  </span>
                </div>

                {q.type === "multiple" && (
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswer === optIdx;
                      const isCorrectOption = q.correctAnswer === optIdx;
                      let optClass =
                        "border border-slate-200 rounded-lg px-4 py-2.5 text-sm cursor-pointer transition-colors";

                      if (submitted) {
                        if (isCorrectOption) {
                          optClass =
                            "border-2 border-green-500 bg-green-50 rounded-lg px-4 py-2.5 text-sm font-medium text-green-800";
                        } else if (isSelected && !isCorrectOption) {
                          optClass =
                            "border-2 border-red-400 bg-red-50 rounded-lg px-4 py-2.5 text-sm text-red-700 line-through";
                        } else {
                          optClass =
                            "border border-slate-100 rounded-lg px-4 py-2.5 text-sm text-slate-400";
                        }
                      } else {
                        if (isSelected) {
                          optClass =
                            "border-2 border-blue-500 bg-blue-50 rounded-lg px-4 py-2.5 text-sm font-medium text-blue-800";
                        } else {
                          optClass += " hover:border-blue-300 hover:bg-blue-50/50";
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
                          btnClass += " border-slate-100 text-slate-400";
                        }
                      } else {
                        if (isSelected) {
                          btnClass += " border-blue-500 bg-blue-50 text-blue-800 border-2";
                        } else {
                          btnClass += " border-slate-200 hover:border-blue-300 hover:bg-blue-50/50";
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
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
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
              className="bg-blue-600 text-white px-8 py-3 rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Шалгах
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
