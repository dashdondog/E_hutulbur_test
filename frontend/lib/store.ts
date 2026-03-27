"use client";

import { Curriculum, Topic, Test } from "@/shared/types";

const STORAGE_KEYS = {
  curricula: "edu_curricula",
  topics: "edu_topics",
  tests: "edu_tests",
};

function getItem<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Curriculum
export function getCurricula(subjectId: string): Curriculum[] {
  return getItem<Curriculum>(STORAGE_KEYS.curricula).filter(
    (c) => c.subjectId === subjectId
  );
}

export function saveCurriculum(curriculum: Curriculum): void {
  const all = getItem<Curriculum>(STORAGE_KEYS.curricula);
  const idx = all.findIndex((c) => c.id === curriculum.id);
  if (idx >= 0) all[idx] = curriculum;
  else all.push(curriculum);
  setItem(STORAGE_KEYS.curricula, all);
}

export function deleteCurriculum(id: string): void {
  const all = getItem<Curriculum>(STORAGE_KEYS.curricula).filter(
    (c) => c.id !== id
  );
  setItem(STORAGE_KEYS.curricula, all);
}

// Topics
export function getTopics(subjectId: string): Topic[] {
  return getItem<Topic>(STORAGE_KEYS.topics)
    .filter((t) => t.subjectId === subjectId)
    .sort((a, b) => a.order - b.order);
}

export function saveTopic(topic: Topic): void {
  const all = getItem<Topic>(STORAGE_KEYS.topics);
  const idx = all.findIndex((t) => t.id === topic.id);
  if (idx >= 0) all[idx] = topic;
  else all.push(topic);
  setItem(STORAGE_KEYS.topics, all);
}

export function deleteTopic(id: string): void {
  const all = getItem<Topic>(STORAGE_KEYS.topics).filter((t) => t.id !== id);
  setItem(STORAGE_KEYS.topics, all);
}

// Tests
export function getTests(subjectId: string): Test[] {
  return getItem<Test>(STORAGE_KEYS.tests).filter(
    (t) => t.subjectId === subjectId
  );
}

export function getTestsByTopic(subjectId: string, topicId: string): Test[] {
  return getItem<Test>(STORAGE_KEYS.tests).filter(
    (t) => t.subjectId === subjectId && t.topicId === topicId
  );
}

export function getTestById(testId: string): Test | undefined {
  return getItem<Test>(STORAGE_KEYS.tests).find((t) => t.id === testId);
}

export function saveTest(test: Test): void {
  const all = getItem<Test>(STORAGE_KEYS.tests);
  const idx = all.findIndex((t) => t.id === test.id);
  if (idx >= 0) all[idx] = test;
  else all.push(test);
  setItem(STORAGE_KEYS.tests, all);
}

export function deleteTest(id: string): void {
  const all = getItem<Test>(STORAGE_KEYS.tests).filter((t) => t.id !== id);
  setItem(STORAGE_KEYS.tests, all);
}

// All (for global search)
export function getAllTopics(): Topic[] {
  return getItem<Topic>(STORAGE_KEYS.topics);
}

export function getAllTests(): Test[] {
  return getItem<Test>(STORAGE_KEYS.tests);
}

// Stats
export function getStats() {
  const topics = getItem<Topic>(STORAGE_KEYS.topics);
  const tests = getItem<Test>(STORAGE_KEYS.tests);
  const questions = tests.reduce((sum, t) => sum + t.questions.length, 0);
  return {
    totalTopics: topics.length,
    totalTests: tests.length,
    totalQuestions: questions,
  };
}
