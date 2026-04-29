"use client";

import { useState, useRef, useEffect } from "react";
import { Curriculum, Test, LessonPlan } from "@/shared/types";
import * as store from "@/frontend/lib/store";
import { Send, Bot, User as UserIcon, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

function isLessonPlan(val: unknown): val is LessonPlan {
  return typeof val === "object" && val !== null && "steps" in val && Array.isArray((val as LessonPlan).steps);
}

type TargetType = "curriculum" | "test";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  applied?: boolean;
}

interface Props {
  curricula: Curriculum[];
  tests: Test[];
  onUpdate: () => void;
  fixedTarget?: Curriculum | Test;
  fixedTargetType?: TargetType;
  onApply?: (updated: Curriculum | Test) => void;
  compact?: boolean;
}

export default function ChatTab({ curricula, tests, onUpdate, fixedTarget, fixedTargetType, onApply, compact }: Props) {
  const isFixed = !!fixedTarget;
  const [targetType, setTargetType] = useState<TargetType>(fixedTargetType ?? "curriculum");
  const [targetId, setTargetId] = useState<string>(fixedTarget?.id ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Sync state to fixedTarget when caller switches what's being edited
  useEffect(() => {
    if (isFixed) {
      setTargetType(fixedTargetType ?? "curriculum");
      setTargetId(fixedTarget?.id ?? "");
    }
  }, [isFixed, fixedTarget?.id, fixedTargetType]);

  // Reset chat when target changes
  useEffect(() => {
    setMessages([]);
  }, [targetType, targetId]);

  const items = targetType === "curriculum" ? curricula : tests;
  const selected = isFixed
    ? fixedTarget
    : targetType === "curriculum"
      ? curricula.find(c => c.id === targetId)
      : tests.find(t => t.id === targetId);

  async function send() {
    if (!input.trim() || !selected || sending) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          target: selected,
          history: messages,
          message: userMsg.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages([
          ...next,
          { role: "assistant", content: `⚠️ ${data.error || "Алдаа гарлаа"}` },
        ]);
        return;
      }

      let applied = false;
      if (data.updated && typeof data.updated === "object") {
        // Preserve immutable system fields
        const merged = {
          ...data.updated,
          id: selected.id,
          subjectId: selected.subjectId,
          createdAt: (selected as Curriculum | Test).createdAt,
        };
        if (onApply) {
          onApply(merged as Curriculum | Test);
        } else if (targetType === "curriculum") {
          store.saveCurriculum(merged as Curriculum);
          onUpdate();
        } else {
          store.saveTest(merged as Test);
          onUpdate();
        }
        applied = true;
      }
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data.reply || (applied ? "Шинэчиллээ." : "Хариу алга."),
          applied,
        },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "⚠️ Сүлжээний алдаа" },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const empty = !isFixed && curricula.length === 0 && tests.length === 0;
  const messagesHeight = compact ? "h-56 sm:h-64" : "h-80 sm:h-96";

  return (
    <div>
      {!isFixed && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text)]">AI Чат — хөтөлбөр/тест засах</h2>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            Засах зүйлээ сонгоод AI-д юу өөрчлөхийг бичнэ үү. Жишээ нь: "Зорилгуудыг богино болго", "5 нэмэлт асуулт нэмж өг", "Гэрийн даалгаврыг сольж бич".
          </p>
        </>
      )}

      {empty ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center text-[var(--color-text-muted)]">
          Эхлээд хөтөлбөр эсвэл тест үүсгэнэ үү.
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          {/* Selector — hidden in fixed/embedded mode */}
          {!isFixed && (
            <div className="border-b border-[var(--color-border)] p-3 flex flex-col sm:flex-row gap-2">
              <div className="flex gap-1 bg-[var(--color-surface-alt)] rounded-lg p-1">
                <button
                  onClick={() => { setTargetType("curriculum"); setTargetId(""); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    targetType === "curriculum"
                      ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  Хөтөлбөр ({curricula.length})
                </button>
                <button
                  onClick={() => { setTargetType("test"); setTargetId(""); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    targetType === "test"
                      ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  Тест ({tests.length})
                </button>
              </div>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="flex-1 border border-[var(--color-border)] rounded-md px-2 py-1.5 text-sm bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">— Сонгох —</option>
                {items.map(it => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selected && (
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]/40">
              <button
                onClick={() => setPreviewOpen(o => !o)}
                className="w-full px-3 py-2 flex items-center justify-between gap-2 hover:bg-[var(--color-surface-alt)]/70"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-[var(--color-primary)]" />
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {isFixed ? `AI Чат — "${selected.name}"-г засах` : `Сонгосон: "${selected.name}"`}
                  </span>
                </span>
                <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                  {targetType === "curriculum" ? "Загвар" : "Тест"} {previewOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </span>
              </button>
              {previewOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-[var(--color-border)]/60 max-h-56 overflow-y-auto">
                  <CurriculumPreview target={selected} targetType={targetType} />
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className={`${messagesHeight} overflow-y-auto p-4 space-y-3 bg-[var(--color-surface-alt)]/30`}>
            {!selected && (
              <div className="text-center text-sm text-[var(--color-text-muted)] py-8">
                Засах {targetType === "curriculum" ? "хөтөлбөрөө" : "тестээ"} сонгоно уу.
              </div>
            )}
            {selected && messages.length === 0 && (
              <div className="text-center text-sm text-[var(--color-text-muted)] py-8">
                "{selected.name}" — юу өөрчлөхийг доор бичнэ үү.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
                  }`}
                >
                  {m.content}
                  {m.applied && (
                    <div className="mt-1 text-[11px] text-[var(--color-primary)] font-medium">
                      ✓ Хадгалагдлаа
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                    <UserIcon size={14} />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm flex items-center gap-2 text-[var(--color-text-muted)]">
                  <span className="animate-pulse">●●●</span> AI бодож байна...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[var(--color-border)] p-3">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={!selected || sending}
                rows={2}
                placeholder={
                  selected
                    ? "Юу өөрчлөхийг бичнэ үү..."
                    : "Эхлээд дээрээс зүйлээ сонго"
                }
                className="flex-1 border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || !selected || sending}
                className="bg-[var(--color-primary)] text-white p-2.5 rounded-md hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Илгээх (Enter)"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
              Enter — илгээх, Shift+Enter — шинэ мөр
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CurriculumPreview({ target, targetType }: { target: Curriculum | Test; targetType: TargetType }) {
  if (targetType === "curriculum") {
    const c = target as Curriculum;
    const plan = isLessonPlan(c.content) ? c.content : null;
    return (
      <div className="text-xs space-y-2 text-[var(--color-text-secondary)]">
        {c.goal && (
          <div>
            <PLabel>Зорилго</PLabel>
            <p className="text-[var(--color-text)] mt-0.5">{c.goal}</p>
          </div>
        )}
        {plan ? (
          <>
            {plan.chapter && (
              <div><PLabel>Бүлэг</PLabel><p className="text-[var(--color-text)] mt-0.5">{plan.chapter}</p></div>
            )}
            {plan.objectives?.length > 0 && (
              <div>
                <PLabel>Зорилтууд</PLabel>
                <ul className="mt-0.5 space-y-0.5">
                  {plan.objectives.map((o, i) => (
                    <li key={i} className="text-[var(--color-text)] flex gap-1.5">
                      <span className="text-[var(--color-primary)]">•</span>{o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {plan.topicSchedule?.length > 0 && (
              <div>
                <PLabel>Сэдвийн хуваарь ({plan.topicSchedule.length})</PLabel>
                <ul className="mt-0.5 space-y-0.5">
                  {plan.topicSchedule.map((t, i) => (
                    <li key={i} className="text-[var(--color-text)]">
                      <span className="text-[var(--color-primary)] font-medium">{t.weekNumber}-р 7хн:</span> {t.topicName}
                      {t.hours ? <span className="text-[var(--color-text-muted)]"> ({t.hours}ц)</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {plan.steps?.length > 0 && (
              <div>
                <PLabel>Үе шатууд ({plan.steps.length})</PLabel>
                <ul className="mt-0.5 space-y-0.5">
                  {plan.steps.map((s, i) => (
                    <li key={i} className="text-[var(--color-text)]">
                      <span className="text-[var(--color-primary)] font-medium">{s.time || "—"}:</span> {s.phase}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {plan.homework && (
              <div><PLabel>Гэрийн даалгавар</PLabel><p className="text-[var(--color-text)] mt-0.5">{plan.homework}</p></div>
            )}
          </>
        ) : (
          c.content && (
            <div>
              <PLabel>Агуулга</PLabel>
              <p className="text-[var(--color-text)] mt-0.5 whitespace-pre-wrap">
                {typeof c.content === "string" ? c.content : JSON.stringify(c.content, null, 2)}
              </p>
            </div>
          )
        )}
      </div>
    );
  }
  const t = target as Test;
  return (
    <div className="text-xs space-y-2 text-[var(--color-text-secondary)]">
      <div><PLabel>Тест</PLabel><p className="text-[var(--color-text)] mt-0.5">{t.name}</p></div>
      {t.questions?.length > 0 && (
        <div>
          <PLabel>Асуултууд ({t.questions.length})</PLabel>
          <ol className="mt-0.5 space-y-0.5 list-decimal list-inside">
            {t.questions.map((q, i) => (
              <li key={i} className="text-[var(--color-text)]">{q.text}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function PLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{children}</span>;
}
