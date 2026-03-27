"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { subjects } from "@/shared/subjects";
import { getAllTopics, getAllTests } from "@/frontend/lib/store";
import { Topic, Test } from "@/shared/types";
import Link from "next/link";
import SubjectIcon from "./SubjectIcon";

interface SearchResults {
  subjects: typeof subjects;
  topics: Topic[];
  tests: Test[];
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setFocused(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const results: SearchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { subjects: [], topics: [], tests: [] };

    const matchedSubjects = subjects.filter((s) =>
      s.name.toLowerCase().includes(q)
    );

    const allTopics = getAllTopics();
    const matchedTopics = allTopics.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.subtopics.some((s) => s.toLowerCase().includes(q))
    );

    const allTests = getAllTests();
    const matchedTests = allTests.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.topicName?.toLowerCase().includes(q)
    );

    return {
      subjects: matchedSubjects,
      topics: matchedTopics.slice(0, 8),
      tests: matchedTests.slice(0, 8),
    };
  }, [query]);

  const hasResults =
    results.subjects.length > 0 ||
    results.topics.length > 0 ||
    results.tests.length > 0;

  const showDropdown = open && query.trim().length > 0;

  function handleNav() {
    setOpen(false);
    setQuery("");
    setFocused(false);
  }

  function getSubjectName(subjectId: string) {
    return subjects.find((s) => s.id === subjectId)?.name || "";
  }

  return (
    <div ref={ref} className="relative flex-1 max-w-md mx-2 sm:mx-4">
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors ${
          focused
            ? "border-[var(--color-primary)] bg-[var(--color-surface)] ring-2 ring-[var(--color-primary)]/20"
            : "border-[var(--color-border)] bg-[var(--color-surface-alt)]"
        }`}
      >
        <Search size={16} className="text-[var(--color-text-muted)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            if (query.trim()) setOpen(true);
          }}
          placeholder="Хайх... (хичээл, сэдэв, тест)"
          className="flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none min-w-0"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl z-50 max-h-[70vh] overflow-y-auto">
          {!hasResults && (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
              &ldquo;{query}&rdquo; илэрц олдсонгүй
            </div>
          )}

          {/* Subjects */}
          {results.subjects.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 mb-1">
                Хичээлүүд
              </p>
              {results.subjects.map((s) => (
                <Link
                  key={s.id}
                  href={`/subjects/${s.id}`}
                  onClick={handleNav}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors"
                >
                  <SubjectIcon icon={s.icon} color={s.color} size="sm" />
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {s.name}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Topics */}
          {results.topics.length > 0 && (
            <div className="p-2 border-t border-[var(--color-border-light)]">
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 mb-1">
                Сэдвүүд
              </p>
              {results.topics.map((t) => (
                <Link
                  key={t.id}
                  href={`/subjects/${t.subjectId}`}
                  onClick={handleNav}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[var(--color-primary)]">С</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {t.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {getSubjectName(t.subjectId)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Tests */}
          {results.tests.length > 0 && (
            <div className="p-2 border-t border-[var(--color-border-light)]">
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 mb-1">
                Тестүүд
              </p>
              {results.tests.map((t) => (
                <Link
                  key={t.id}
                  href={`/subjects/${t.subjectId}/tests/${t.id}`}
                  onClick={handleNav}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[var(--color-accent-dark)]">Т</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {t.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {getSubjectName(t.subjectId)} • {t.topicName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
