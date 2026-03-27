"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { subjects } from "@/shared/subjects";
import { Subject, Curriculum, Topic, Test } from "@/shared/types";
import * as store from "@/frontend/lib/store";
import SubjectIcon from "@/frontend/components/SubjectIcon";
import FileUpload from "@/frontend/components/FileUpload";
import CurriculumTab from "@/frontend/components/CurriculumTab";
import TopicsTab from "@/frontend/components/TopicsTab";
import TestsTab from "@/frontend/components/TestsTab";
import ResultsTab from "@/frontend/components/ResultsTab";
import { useAuth } from "@/frontend/lib/auth-context";
import { FolderOpen, BookOpen, List, ClipboardList, BarChart3 } from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

type Tab = "files" | "curriculum" | "topics" | "tests" | "results";

export default function SubjectPage() {
  const params = useParams();
  const subjectId = params.id as string;
  const { user } = useAuth();
  const subject = subjects.find((s) => s.id === subjectId) as Subject;

  const [activeTab, setActiveTab] = useState<Tab>("files");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [genProgress, setGenProgress] = useState<{ current: number; total: number; topic: string } | null>(null);

  const loadFiles = useCallback(async () => {
    const res = await fetch(`/api/upload?subjectId=${subjectId}`);
    const data = await res.json();
    setFiles(data.files || []);
  }, [subjectId]);

  const reloadData = useCallback(async () => {
    const [c, t, te] = await Promise.all([
      store.getCurricula(subjectId),
      store.getTopics(subjectId),
      store.getTests(subjectId),
    ]);
    setCurricula(c);
    setTopics(t);
    setTests(te);
  }, [subjectId]);

  useEffect(() => {
    loadFiles();
    reloadData();
  }, [loadFiles, reloadData]);

  // AI Generate All 4 Lesson Plans in one call
  async function handleGenerateCurriculum() {
    if (files.length === 0) {
      alert("Эхлээд PDF файл байршуулна уу");
      return;
    }
    setGenerating("curriculum");
    setGenProgress({ current: 0, total: 0, topic: "Бүлэг, сэдвүүдийг ялгаж 10 долоо хоногт хуваарьлаж байна..." });
    try {
      const res = await fetch("/api/generate/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }

      const plans = data.plans || [];
      for (let i = 0; i < plans.length; i++) {
        const p = plans[i];
        // Skip plans with empty names
        if (!p.name || !p.name.trim()) continue;
        setGenProgress({ current: i + 1, total: plans.length, topic: p.name });
        const curriculum: Curriculum = {
          id: crypto.randomUUID(),
          subjectId,
          name: p.name,
          goal: p.goal || p.name,
          content: p.content,
          criteria: p.criteria,
          weeks: 10,
          createdAt: new Date().toISOString(),
        };
        await store.saveCurriculum(curriculum);
      }
      await reloadData();
      setActiveTab("curriculum");
    } catch {
      alert("Хөтөлбөр үүсгэхэд алдаа гарлаа");
    } finally {
      setGenerating(null);
      setGenProgress(null);
    }
  }

  // AI Generate Topics
  async function handleGenerateTopics() {
    if (files.length === 0) {
      alert("Эхлээд PDF файл байршуулна уу");
      return;
    }
    setGenerating("topics");
    try {
      const res = await fetch("/api/generate/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      // Save topics to store
      for (let idx = 0; idx < data.topics.length; idx++) {
        const t: { name: string; description: string; subtopics: string[] } = data.topics[idx];
        const topic: Topic = {
          id: crypto.randomUUID(),
          subjectId,
          name: t.name,
          description: t.description,
          subtopics: t.subtopics,
          order: idx,
        };
        await store.saveTopic(topic);
      }
      await reloadData();
      setActiveTab("topics");
    } catch {
      alert("Сэдвүүд үүсгэхэд алдаа гарлаа");
    } finally {
      setGenerating(null);
    }
  }

  // AI Generate Test for a specific topic
  async function handleGenerateTest(topic: Topic, questionCount: number = 10) {
    if (files.length === 0) {
      alert("Эхлээд PDF файл байршуулна уу");
      return;
    }
    setGenerating(`test-${topic.id}`);
    try {
      const res = await fetch("/api/generate/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          topicName: topic.name,
          subtopics: topic.subtopics,
          questionCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      // Save test
      const test: Test = {
        id: crypto.randomUUID(),
        subjectId,
        topicId: topic.id,
        topicName: topic.name,
        name: data.test.name,
        duration: data.test.duration,
        questions: data.test.questions.map(
          (q: { text: string; type: string; options: string[]; correctAnswer: number; points: number }) => ({
            ...q,
            id: crypto.randomUUID(),
          })
        ),
        createdAt: new Date().toISOString(),
      };
      await store.saveTest(test);
      await reloadData();
      setActiveTab("tests");
    } catch {
      alert("Тест үүсгэхэд алдаа гарлаа");
    } finally {
      setGenerating(null);
    }
  }

  // Generate tests for ALL topics
  async function handleGenerateAllTests() {
    if (topics.length === 0) {
      alert("Эхлээд сэдвүүдийг үүсгэнэ үү");
      return;
    }
    setGenerating("all-tests");
    try {
      for (const topic of topics) {
        setGenerating(`test-${topic.id}`);
        await handleGenerateTest(topic);
      }
    } finally {
      setGenerating(null);
    }
  }

  if (!subject) {
    return (
      <div className="p-8 text-center text-[var(--color-text-secondary)]">Хичээл олдсонгүй</div>
    );
  }

  const tabs: { key: Tab; label: string; count: number; icon: ComponentType<LucideProps> }[] = [
    { key: "files", label: "Файлууд", count: files.length, icon: FolderOpen },
    { key: "curriculum", label: "Хөтөлбөр", count: curricula.length, icon: BookOpen },
    { key: "topics", label: "Сэдвүүд", count: topics.length, icon: List },
    { key: "tests", label: "Тестүүд", count: tests.length, icon: ClipboardList },
    ...(user?.role === "teacher" ? [{ key: "results" as Tab, label: "Дүнгүүд", count: 0, icon: BarChart3 }] : []),
  ];

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <SubjectIcon icon={subject.icon} color={subject.color} size="lg" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">
                {subject.name}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                11-р ангийн сурах бичиг • {files.length} файл
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--color-surface-alt)] rounded-lg p-1 mb-4 sm:mb-6 w-full sm:w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-xs px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Files */}
        {activeTab === "files" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Сурах бичиг & Нэмэлт материал
              </h2>
            </div>
            <FileUpload
              subjectId={subjectId}
              files={files}
              onFilesChange={loadFiles}
            />

            {/* AI Generate Actions */}
            {files.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 rounded-xl border border-[var(--color-primary)]/20 p-4 sm:p-6">
                <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">
                  AI-р автомат үүсгэх
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Байршуулсан файлуудын агуулгаас автоматаар хөтөлбөр, сэдэв, тест
                  үүсгэнэ
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleGenerateCurriculum}
                    disabled={!!generating}
                    className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                  >
                    {generating === "curriculum" ? (
                      <>
                        <Spinner /> Хөтөлбөр үүсгэж байна...
                      </>
                    ) : (
                      <>📋 Хөтөлбөр үүсгэх</>
                    )}
                  </button>
                  <button
                    onClick={handleGenerateTopics}
                    disabled={!!generating}
                    className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                  >
                    {generating === "topics" ? (
                      <>
                        <Spinner /> Сэдвүүд гаргаж байна...
                      </>
                    ) : (
                      <>📑 Сэдвүүд гаргах</>
                    )}
                  </button>
                  {topics.length > 0 && (
                    <button
                      onClick={handleGenerateAllTests}
                      disabled={!!generating}
                      className="flex items-center gap-2 bg-[var(--color-accent)] text-black px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-dark)] transition-colors disabled:opacity-50"
                    >
                      {generating === "all-tests" ? (
                        <>
                          <Spinner /> Бүх тест үүсгэж байна...
                        </>
                      ) : (
                        <>✅ Бүх сэдвээр тест үүсгэх</>
                      )}
                    </button>
                  )}
                </div>
                {generating && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
                      <Spinner />
                      AI боловсруулж байна... Хэдэн секунд хүлээнэ үү
                    </div>
                    {genProgress && (
                      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-primary)]/20 p-3">
                        <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                          <span>{genProgress.topic}</span>
                          {genProgress.total > 0 && (
                            <span className="font-medium">{genProgress.current}/{genProgress.total}</span>
                          )}
                        </div>
                        {genProgress.total > 0 && (
                          <div className="w-full bg-[var(--color-surface-alt)] rounded-full h-2">
                            <div
                              className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(genProgress.current / genProgress.total) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Curriculum */}
        {activeTab === "curriculum" && (
          <div>
            {files.length > 0 && curricula.length === 0 && (
              <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-primary)]">
                      PDF-ээс бүх сэдвээр хөтөлбөр үүсгэх үү?
                    </p>
                    <p className="text-xs text-[var(--color-primary)] mt-0.5">
                      Номны бүх бүлэг/сэдвээр тус тусад нь нэгж хөтөлбөр үүсгэнэ
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateCurriculum}
                    disabled={!!generating}
                    className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
                  >
                    {generating === "curriculum" ? (
                      <>
                        <Spinner /> Үүсгэж байна...
                      </>
                    ) : (
                      "AI-р бүгдийг үүсгэх"
                    )}
                  </button>
                </div>
                {generating === "curriculum" && genProgress && (
                  <div className="mt-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-primary)]/20 p-3">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                      <span>{genProgress.topic}</span>
                      {genProgress.total > 0 && (
                        <span className="font-medium">{genProgress.current}/{genProgress.total}</span>
                      )}
                    </div>
                    {genProgress.total > 0 && (
                      <div className="w-full bg-[var(--color-surface-alt)] rounded-full h-2">
                        <div
                          className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(genProgress.current / genProgress.total) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <CurriculumTab
              subjectId={subjectId}
              curricula={curricula}
              onUpdate={reloadData}
            />
          </div>
        )}

        {/* Tab: Topics */}
        {activeTab === "topics" && (
          <div>
            {files.length > 0 && topics.length === 0 && (
              <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl p-4 mb-4 flex items-center justify-between">
                <p className="text-sm text-[var(--color-primary)]">
                  PDF-ээс автоматаар сэдвүүд гаргах уу?
                </p>
                <button
                  onClick={handleGenerateTopics}
                  disabled={!!generating}
                  className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
                >
                  {generating === "topics" ? (
                    <>
                      <Spinner /> Гаргаж байна...
                    </>
                  ) : (
                    "AI-р гаргах"
                  )}
                </button>
              </div>
            )}
            <TopicsTab
              subjectId={subjectId}
              onUpdate={reloadData}
            />
          </div>
        )}

        {/* Tab: Tests */}
        {activeTab === "tests" && (
          <div>
            {topics.length > 0 && files.length > 0 && (
              <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[var(--color-primary)]">
                    Сэдэв сонгоод тест үүсгэх
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleGenerateTest(topic)}
                      disabled={!!generating}
                      className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-accent)]/30 text-[var(--color-primary)] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[var(--color-accent)]/10 transition-colors disabled:opacity-50"
                    >
                      {generating === `test-${topic.id}` ? (
                        <>
                          <Spinner /> Үүсгэж байна...
                        </>
                      ) : (
                        <>+ {topic.name}</>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <TestsTab
              subjectId={subjectId}
              onUpdate={reloadData}
            />
          </div>
        )}

        {/* Tab: Results (teacher only) */}
        {activeTab === "results" && user?.role === "teacher" && (
          <ResultsTab subjectId={subjectId} />
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
