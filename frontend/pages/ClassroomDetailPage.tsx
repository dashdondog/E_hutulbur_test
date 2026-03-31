"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { subjects } from "@/shared/subjects";
import * as store from "@/frontend/lib/store";
import { Test, TestResult } from "@/shared/types";
import Link from "next/link";
import { Users, ClipboardList, BarChart3, Copy, Check, Trash2, Plus, ArrowLeft, UserPlus, Eye, EyeOff, Pencil } from "lucide-react";

interface Member { _id: string; userId: string; userName: string; joinedAt: string; loginCode?: string; }
interface AssignmentItem { _id: string; testId: string; subjectId: string; testName: string; topicName: string; deadline: string; createdAt: string; }
interface ClassroomData { name: string; joinCode: string; teacherName: string; subjectId?: string; }
interface NewStudent { name: string; loginCode: string; password: string; }

export default function ClassroomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [classroom, setClassroom] = useState<ClassroomData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [classAverage, setClassAverage] = useState(0);
  const [activeTab, setActiveTab] = useState<"members" | "assignments" | "results">("members");
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Assign test modal
  const [showAssign, setShowAssign] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectTests, setSubjectTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [deadline, setDeadline] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Edit deadline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDeadline, setEditDeadline] = useState("");

  // Add student modal
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState("");
  const [createdStudent, setCreatedStudent] = useState<NewStudent | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [detailRes, resultsRes, studentsRes] = await Promise.all([
        fetch(`/api/classrooms/${id}`),
        fetch(`/api/classrooms/${id}/results`),
        fetch(`/api/classrooms/${id}/students`),
      ]);
      const detail = await detailRes.json();
      const resData = await resultsRes.json();
      const studentsData = await studentsRes.json();

      setClassroom(detail.classroom);
      setAssignments(detail.assignments || []);
      setResults(resData.results || []);
      setClassAverage(resData.classAverage || 0);

      // Merge loginCode from students endpoint into members
      const studentMap: Record<string, string> = {};
      for (const s of studentsData.students || []) {
        studentMap[s.userId] = s.loginCode;
      }
      const membersWithCode = (detail.members || []).map((m: Member) => ({
        ...m,
        loginCode: studentMap[m.userId] ?? null,
      }));
      setMembers(membersWithCode);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // When assign modal opens, auto-select the classroom's subject
  useEffect(() => {
    if (showAssign && classroom?.subjectId) {
      setSelectedSubject(classroom.subjectId);
    }
  }, [showAssign, classroom?.subjectId]);

  useEffect(() => {
    if (selectedSubject) {
      setSubjectTests(store.getTests(selectedSubject));
      setSelectedTest(null);
    }
  }, [selectedSubject]);

  async function handleAssign() {
    if (!selectedTest || !deadline) return;
    setAssigning(true);
    await fetch(`/api/classrooms/${id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testId: selectedTest.id,
        subjectId: selectedTest.subjectId,
        testName: selectedTest.name,
        topicName: selectedTest.topicName,
        deadline,
      }),
    });
    setShowAssign(false);
    setSelectedSubject("");
    setSelectedTest(null);
    setDeadline("");
    setAssigning(false);
    loadData();
  }

  async function handleEditDeadline(assignmentId: string) {
    if (!editDeadline) return;
    await fetch(`/api/classrooms/${id}/assignments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, deadline: editDeadline }),
    });
    setEditingId(null);
    setEditDeadline("");
    loadData();
  }

  async function handleDeleteAssignment(assignmentId: string) {
    await fetch(`/api/classrooms/${id}/assignments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId }),
    });
    loadData();
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setAddStudentError("");
    setAddingStudent(true);
    try {
      const res = await fetch(`/api/classrooms/${id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStudentName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddStudentError(data.error || "Алдаа гарлаа");
        return;
      }
      setCreatedStudent(data);
      setNewStudentName("");
      loadData();
    } finally {
      setAddingStudent(false);
    }
  }

  async function handleRemoveStudent(userId: string) {
    if (!confirm("Сурагчийг анги болон системээс устгах уу?")) return;
    await fetch(`/api/classrooms/${id}/students`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    loadData();
  }

  function copyCode() {
    if (classroom) {
      navigator.clipboard.writeText(classroom.joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }

  function copyLoginInfo() {
    if (createdStudent) {
      navigator.clipboard.writeText(`Нэвтрэх код: ${createdStudent.loginCode}\nНууц үг: ${createdStudent.password}`);
      setCopiedLogin(true);
      setTimeout(() => setCopiedLogin(false), 2000);
    }
  }

  function getMemberResult(userId: string, testId: string) {
    return results.find((r) => r.userId === userId && r.testId === testId);
  }

  function getMemberAverage(userId: string) {
    const memberResults = results.filter((r) => r.userId === userId);
    if (memberResults.length === 0) return null;
    return Math.round(memberResults.reduce((s, r) => s + r.percentage, 0) / memberResults.length);
  }

  function getSubjectName(subjectId: string) {
    return subjects.find((s) => s.id === subjectId)?.name || subjectId;
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

  const tabs = [
    { key: "members", label: "Сурагчид", icon: Users, count: members.length },
    { key: "assignments", label: "Даалгаварууд", icon: ClipboardList, count: assignments.length },
    { key: "results", label: "Дүнгүүд", icon: BarChart3 },
  ] as const;

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/classrooms" className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-3">
            <ArrowLeft size={14} /> Ангиуд руу буцах
          </Link>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">{classroom.name}</h1>
              {classroom.subjectId && (
                <p className="text-sm text-[var(--color-primary)] font-medium mt-0.5">{getSubjectName(classroom.subjectId)}</p>
              )}
            </div>
            <div className="flex items-center gap-2 bg-[var(--color-surface-alt)] px-3 py-1.5 rounded-lg">
              <span className="text-xs text-[var(--color-text-muted)]">Нэгдэх код:</span>
              <code className="font-mono font-bold text-[var(--color-primary)]">{classroom.joinCode}</code>
              <button onClick={copyCode} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                {copiedCode ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-[var(--color-text-secondary)]">
            <span>{members.length} сурагч</span>
            <span>{assignments.length} даалгавар</span>
            <span>Дундаж оноо: {classAverage}%</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[var(--color-surface-alt)] p-1 rounded-lg w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                activeTab === t.key
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] font-medium shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              <t.icon size={14} />
              {t.label}
              {"count" in t && <span className="text-xs opacity-60">({t.count})</span>}
            </button>
          ))}
        </div>

        {/* Members tab */}
        {activeTab === "members" && (
          <div>
            <button
              onClick={() => { setShowAddStudent(true); setCreatedStudent(null); setAddStudentError(""); }}
              className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium mb-4"
            >
              <UserPlus size={16} /> Сурагч нэмэх
            </button>

            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
              {members.length === 0 ? (
                <div className="p-8 text-center text-[var(--color-text-muted)]">
                  <Users size={40} className="mx-auto mb-3 opacity-50" />
                  <p>Сурагч байхгүй байна</p>
                  <p className="text-sm mt-1">"Сурагч нэмэх" товч дарж сурагч нэмнэ үү</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">#</th>
                      <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Нэр</th>
                      <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Нэвтрэх код</th>
                      <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Дундаж</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, i) => {
                      const avg = getMemberAverage(m.userId);
                      return (
                        <tr key={m._id} className="border-b border-[var(--color-border-light)] last:border-0">
                          <td className="px-4 py-3 text-[var(--color-text-muted)]">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-[var(--color-text)]">{m.userName}</td>
                          <td className="px-4 py-3">
                            {m.loginCode ? (
                              <code className="font-mono text-xs bg-[var(--color-surface-alt)] px-2 py-0.5 rounded text-[var(--color-primary)]">{m.loginCode}</code>
                            ) : (
                              <span className="text-[var(--color-text-muted)] text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {avg !== null ? (
                              <span className={`font-medium ${avg >= 70 ? "text-green-600" : avg >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                                {avg}%
                              </span>
                            ) : (
                              <span className="text-[var(--color-text-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleRemoveStudent(m.userId)} className="text-[var(--color-text-muted)] hover:text-red-500 p-1">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Add student modal */}
            {showAddStudent && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddStudent(false)}>
                <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">Сурагч нэмэх</h2>

                  {!createdStudent ? (
                    <form onSubmit={handleAddStudent} className="space-y-4">
                      {addStudentError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{addStudentError}</div>
                      )}
                      <div>
                        <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Сурагчийн нэр</label>
                        <input
                          type="text"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          required
                          autoFocus
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] text-sm"
                          placeholder="Овог Нэр"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAddStudent(false)} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] rounded-lg">
                          Болих
                        </button>
                        <button type="submit" disabled={addingStudent} className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
                          {addingStudent ? "Үүсгэж байна..." : "Нэмэх"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-800 mb-3">Сурагч амжилттай нэмэгдлээ! Дараах мэдээллийг сурагчид өгнө үү:</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200">
                            <div>
                              <span className="text-xs text-gray-500 block">Нэвтрэх код</span>
                              <code className="font-mono font-bold text-[var(--color-primary)]">{createdStudent.loginCode}</code>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200">
                            <div>
                              <span className="text-xs text-gray-500 block">Нууц үг</span>
                              <code className="font-mono font-bold text-gray-800">
                                {showPassword ? createdStudent.password : "••••••••"}
                              </code>
                            </div>
                            <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 ml-2">
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-green-700 mt-2">Анхны нууц үг бүх сурагчид адилхан байна. Сурагч нэвтэрсний дараа нууц үгээ солих ёстой.</p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={copyLoginInfo} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-alt)]">
                          {copiedLogin ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          {copiedLogin ? "Хуулагдлаа" : "Хуулах"}
                        </button>
                        <button
                          onClick={() => { setCreatedStudent(null); setShowPassword(false); }}
                          className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)]"
                        >
                          Дараагийн сурагч
                        </button>
                        <button onClick={() => { setShowAddStudent(false); setCreatedStudent(null); setShowPassword(false); }} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] rounded-lg">
                          Хаах
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assignments tab */}
        {activeTab === "assignments" && (
          <div>
            <button
              onClick={() => setShowAssign(true)}
              className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium mb-4"
            >
              <Plus size={16} /> Тест даалгавар өгөх
            </button>

            {assignments.length === 0 ? (
              <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[var(--color-text-muted)]">
                Даалгавар өгөөгүй байна
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => {
                  const isOverdue = new Date(a.deadline) < new Date();
                  const isEditing = editingId === a._id;
                  return (
                    <div key={a._id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[var(--color-text)]">{a.testName}</p>
                          <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] mt-1">
                            <span>{getSubjectName(a.subjectId)}</span>
                            {a.topicName && <span>• {a.topicName}</span>}
                            {!isEditing && (
                              <span className={isOverdue ? "text-red-500" : "text-green-600"}>
                                Хугацаа: {new Date(a.deadline).toLocaleString("mn", {
                                  year: "numeric", month: "2-digit", day: "2-digit",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                                {isOverdue && " (дууссан)"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingId(a._id); setEditDeadline(a.deadline.slice(0, 16)); }}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] p-1"
                          >
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteAssignment(a._id)} className="text-[var(--color-text-muted)] hover:text-red-500 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {isEditing && (
                        <div className="flex items-center gap-2 mt-3">
                          <input
                            type="datetime-local"
                            value={editDeadline}
                            onChange={(e) => setEditDeadline(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] text-sm"
                          />
                          <button onClick={() => handleEditDeadline(a._id)} className="px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)]">
                            Хадгалах
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] rounded-lg">
                            Болих
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Assign test modal */}
            {showAssign && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAssign(false)}>
                <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">Тест даалгавар өгөх</h2>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Хичээл</label>
                      <div className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] text-sm font-medium">
                        {getSubjectName(selectedSubject)}
                      </div>
                    </div>

                    {selectedSubject && (
                      <div>
                        <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Тест</label>
                        {subjectTests.length === 0 ? (
                          <p className="text-sm text-[var(--color-text-muted)]">Энэ хичээлд тест байхгүй</p>
                        ) : (
                          <select
                            value={selectedTest?.id || ""}
                            onChange={(e) => setSelectedTest(subjectTests.find((t) => t.id === e.target.value) || null)}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] text-sm"
                          >
                            <option value="">Сонгох...</option>
                            {subjectTests.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.questions.length} асуулт)</option>)}
                          </select>
                        )}
                      </div>
                    )}

                    {selectedTest && (
                      <div>
                        <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Хугацаа</label>
                        <input
                          type="datetime-local"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setShowAssign(false)} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] rounded-lg">
                      Болих
                    </button>
                    <button onClick={handleAssign} disabled={assigning || !selectedTest || !deadline} className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
                      {assigning ? "Хадгалж байна..." : "Даалгавар өгөх"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results tab */}
        {activeTab === "results" && (
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
            {assignments.length === 0 || members.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-muted)]">
                Даалгавар эсвэл сурагч байхгүй байна
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium sticky left-0 bg-[var(--color-surface)]">Сурагч</th>
                    {assignments.map((a) => (
                      <th key={a._id} className="text-center px-3 py-3 text-[var(--color-text-muted)] font-medium min-w-[100px]">
                        <div className="text-xs">{a.testName}</div>
                      </th>
                    ))}
                    <th className="text-center px-4 py-3 text-[var(--color-text-muted)] font-medium">Дундаж</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const avg = getMemberAverage(m.userId);
                    return (
                      <tr key={m._id} className="border-b border-[var(--color-border-light)] last:border-0">
                        <td className="px-4 py-3 font-medium text-[var(--color-text)] sticky left-0 bg-[var(--color-surface)]">{m.userName}</td>
                        {assignments.map((a) => {
                          const r = getMemberResult(m.userId, a.testId);
                          return (
                            <td key={a._id} className="text-center px-3 py-3">
                              {r ? (
                                <span className={`font-medium ${r.percentage >= 70 ? "text-green-600" : r.percentage >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                                  {r.percentage}%
                                </span>
                              ) : (
                                <span className="text-[var(--color-text-muted)]">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center px-4 py-3 font-bold">
                          {avg !== null ? (
                            <span className={avg >= 70 ? "text-green-600" : avg >= 50 ? "text-yellow-600" : "text-red-500"}>
                              {avg}%
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
