"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/frontend/lib/auth-context";
import { subjects } from "@/shared/subjects";
import { TestResult } from "@/shared/types";
import Link from "next/link";
import { ArrowLeft, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface AssignmentItem {
  _id: string;
  testId: string;
  subjectId: string;
  testName: string;
  topicName: string;
  deadline: string;
}

interface ClassroomInfo {
  name: string;
  teacherName: string;
  subjectId?: string;
}

export default function StudentClassroomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState<ClassroomInfo | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/classrooms/${id}`).then((r) => r.json()),
      fetch("/api/test-results").then((r) => r.json()),
    ]).then(([detail, resData]) => {
      setClassroom(detail.classroom);
      setAssignments(detail.assignments || []);
      setResults(resData.results || []);
    }).finally(() => setLoading(false));
  }, [id]);

  function getSubjectName(subjectId: string) {
    return subjects.find((s) => s.id === subjectId)?.name || subjectId;
  }

  function getResult(testId: string) {
    return results.find((r) => r.testId === testId && r.userId === user?.userId);
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!classroom) {
    return <div className="p-8 text-center text-[var(--color-text-muted)]">Анги олдсонгүй</div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/student/classrooms" className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-3">
          <ArrowLeft size={14} /> Ангиуд руу буцах
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{classroom.name}</h1>
          {classroom.subjectId && (
            <p className="text-sm text-[var(--color-primary)] font-medium mt-0.5">{getSubjectName(classroom.subjectId)}</p>
          )}
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Багш: {classroom.teacherName}</p>
        </div>

        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Даалгаварууд</h2>

        {assignments.length === 0 ? (
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[var(--color-text-muted)]">
            Одоогоор даалгавар байхгүй байна
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const result = getResult(a.testId);
              const isOverdue = new Date(a.deadline) < new Date();
              const completed = !!result;

              return (
                <div key={a._id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium text-[var(--color-text)]">{a.testName}</p>
                      <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] mt-1">
                        <span>{getSubjectName(a.subjectId)}</span>
                        {a.topicName && <span>• {a.topicName}</span>}
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(a.deadline).toLocaleString("mn", {
                            year: "numeric", month: "2-digit", day: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {completed ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-500" />
                          <span className={`font-bold ${result.percentage >= 70 ? "text-green-600" : result.percentage >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                            {result.percentage}%
                          </span>
                        </div>
                      ) : isOverdue ? (
                        <div className="flex items-center gap-1 text-red-500 text-sm">
                          <AlertCircle size={14} />
                          Хугацаа дууссан
                        </div>
                      ) : (
                        <Link
                          href={`/student/subjects/${a.subjectId}/tests/${a.testId}`}
                          className="bg-[var(--color-primary)] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                          Тест өгөх
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
