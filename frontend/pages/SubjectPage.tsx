"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { subjects } from "@/shared/subjects";
import { Subject, Curriculum, Topic, Test } from "@/shared/types";
import * as store from "@/frontend/lib/store";
import FileUpload from "@/frontend/components/FileUpload";
import CurriculumTab from "@/frontend/components/CurriculumTab";
import TopicsTab from "@/frontend/components/TopicsTab";
import TestsTab from "@/frontend/components/TestsTab";

interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

type Tab = "files" | "curriculum" | "topics" | "tests";

export default function SubjectPage() {
  const params = useParams();
  const subjectId = params.id as string;
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

  const reloadData = useCallback(() => {
    setCurricula(store.getCurricula(subjectId));
    setTopics(store.getTopics(subjectId));
    setTests(store.getTests(subjectId));
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
        store.saveCurriculum(curriculum);
      }
      reloadData();
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
      // Save topics to local storage
      data.topics.forEach(
        (
          t: { name: string; description: string; subtopics: string[] },
          idx: number
        ) => {
          const topic: Topic = {
            id: crypto.randomUUID(),
            subjectId,
            name: t.name,
            description: t.description,
            subtopics: t.subtopics,
            order: idx,
          };
          store.saveTopic(topic);
        }
      );
      reloadData();
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
      store.saveTest(test);
      reloadData();
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
      <div className="p-8 text-center text-slate-500">Хичээл олдсонгүй</div>
    );
  }

  const tabs: { key: Tab; label: string; count: number; icon: string }[] = [
    { key: "files", label: "Файлууд", count: files.length, icon: "📂" },
    { key: "curriculum", label: "Хөтөлбөр", count: curricula.length, icon: "📋" },
    { key: "topics", label: "Сэдвүүд", count: topics.length, icon: "📑" },
    { key: "tests", label: "Тестүүд", count: tests.length, icon: "✅" },
  ];

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: subject.color + "15" }}
            >
              {subject.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {subject.name}
              </h1>
              <p className="text-sm text-slate-500">
                11-р ангийн сурах бичиг • {files.length} файл
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">
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
              <h2 className="text-lg font-semibold text-slate-700">
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
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  AI-р автомат үүсгэх
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Байршуулсан файлуудын агуулгаас автоматаар хөтөлбөр, сэдэв, тест
                  үүсгэнэ
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleGenerateCurriculum}
                    disabled={!!generating}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                    className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
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
                      className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
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
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Spinner />
                      AI боловсруулж байна... Хэдэн секунд хүлээнэ үү
                    </div>
                    {genProgress && (
                      <div className="bg-white rounded-lg border border-blue-200 p-3">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>{genProgress.topic}</span>
                          {genProgress.total > 0 && (
                            <span className="font-medium">{genProgress.current}/{genProgress.total}</span>
                          )}
                        </div>
                        {genProgress.total > 0 && (
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
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
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      PDF-ээс бүх сэдвээр хөтөлбөр үүсгэх үү?
                    </p>
                    <p className="text-xs text-blue-500 mt-0.5">
                      Номны бүх бүлэг/сэдвээр тус тусад нь нэгж хөтөлбөр үүсгэнэ
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateCurriculum}
                    disabled={!!generating}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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
                  <div className="mt-3 bg-white rounded-lg border border-blue-200 p-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span>{genProgress.topic}</span>
                      {genProgress.total > 0 && (
                        <span className="font-medium">{genProgress.current}/{genProgress.total}</span>
                      )}
                    </div>
                    {genProgress.total > 0 && (
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
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
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 flex items-center justify-between">
                <p className="text-sm text-purple-700">
                  PDF-ээс автоматаар сэдвүүд гаргах уу?
                </p>
                <button
                  onClick={handleGenerateTopics}
                  disabled={!!generating}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
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
              topics={topics}
              onUpdate={reloadData}
            />
          </div>
        )}

        {/* Tab: Tests */}
        {activeTab === "tests" && (
          <div>
            {topics.length > 0 && files.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-green-800">
                    Сэдэв сонгоод тест үүсгэх
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleGenerateTest(topic)}
                      disabled={!!generating}
                      className="flex items-center gap-1.5 bg-white border border-green-300 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-50 transition-colors disabled:opacity-50"
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
              topics={topics}
              tests={tests}
              onUpdate={reloadData}
            />
          </div>
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
