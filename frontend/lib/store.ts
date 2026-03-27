"use client";

import { Curriculum, Topic, Test } from "@/shared/types";

// Curriculum
export async function getCurricula(subjectId: string): Promise<Curriculum[]> {
  const res = await fetch(`/api/curricula?subjectId=${subjectId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.curricula || [];
}

export async function saveCurriculum(curriculum: Curriculum): Promise<void> {
  await fetch("/api/curricula", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(curriculum),
  });
}

export async function deleteCurriculum(id: string): Promise<void> {
  await fetch("/api/curricula", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

// Topics
export async function getTopics(subjectId: string): Promise<Topic[]> {
  const res = await fetch(`/api/topics?subjectId=${subjectId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.topics || [];
}

export async function saveTopic(topic: Topic): Promise<void> {
  await fetch("/api/topics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(topic),
  });
}

export async function deleteTopic(id: string): Promise<void> {
  await fetch("/api/topics", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

// Tests
export async function getTests(subjectId: string): Promise<Test[]> {
  const res = await fetch(`/api/tests?subjectId=${subjectId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.tests || [];
}

export async function getTestsByTopic(subjectId: string, topicId: string): Promise<Test[]> {
  const res = await fetch(`/api/tests?subjectId=${subjectId}&topicId=${topicId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.tests || [];
}

export async function getTestById(testId: string): Promise<Test | undefined> {
  const res = await fetch(`/api/tests?testId=${testId}`);
  if (!res.ok) return undefined;
  const data = await res.json();
  return data.test || undefined;
}

export async function saveTest(test: Test): Promise<void> {
  await fetch("/api/tests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(test),
  });
}

export async function deleteTest(id: string): Promise<void> {
  await fetch("/api/tests", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

// All (for global search)
export async function getAllTopics(): Promise<Topic[]> {
  const res = await fetch("/api/topics");
  if (!res.ok) return [];
  const data = await res.json();
  return data.topics || [];
}

export async function getAllTests(): Promise<Test[]> {
  const res = await fetch("/api/tests");
  if (!res.ok) return [];
  const data = await res.json();
  return data.tests || [];
}

// Stats
export async function getStats(): Promise<{ totalTopics: number; totalTests: number; totalQuestions: number }> {
  const res = await fetch("/api/stats");
  if (!res.ok) return { totalTopics: 0, totalTests: 0, totalQuestions: 0 };
  return res.json();
}
