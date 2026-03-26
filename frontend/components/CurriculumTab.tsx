"use client";

import { useState } from "react";
import { Curriculum, LessonPlan, LessonStep, CriteriaItem, TopicWeek } from "@/shared/types";
import * as store from "@/frontend/lib/store";
import { downloadLessonPlanPdf } from "@/frontend/lib/generatePdf";

interface Props {
  subjectId: string;
  curricula: Curriculum[];
  onUpdate: () => void;
}

function isLessonPlan(val: unknown): val is LessonPlan {
  return typeof val === "object" && val !== null && "steps" in val && Array.isArray((val as LessonPlan).steps);
}

function isCriteriaArray(val: unknown): val is CriteriaItem[] {
  return Array.isArray(val) && val.length > 0 && typeof val[0]?.name === "string";
}

// ============ FORM STATE ============
interface EditForm {
  name: string;
  goal: string;
  chapter: string;
  topicSchedule: TopicWeek[];
  duration: string;
  planGoal: string;
  objectives: string[];
  lessonForm: string;
  methods: string[];
  materials: string[];
  steps: LessonStep[];
  homework: string;
  reflection: string;
  criteria: CriteriaItem[];
}

function emptyForm(): EditForm {
  return {
    name: "", goal: "", chapter: "",
    topicSchedule: [{ weekNumber: 1, topicName: "", description: "", hours: 2 }],
    duration: "80 минут (2 цаг)", planGoal: "",
    objectives: [""], lessonForm: "", methods: [""], materials: [""],
    steps: [{ time: "5 мин", phase: "Хичээлийн эхлэл", teacherActivity: "", studentActivity: "", methods: "", assessment: "" }],
    homework: "", reflection: "",
    criteria: [{ name: "", percentage: 0, description: "" }],
  };
}

function curriculumToForm(c: Curriculum): EditForm {
  if (isLessonPlan(c.content)) {
    const p = c.content;
    return {
      name: c.name, goal: c.goal,
      chapter: p.chapter || p.topic || "",
      topicSchedule: p.topicSchedule?.length ? p.topicSchedule.map(t => ({ ...t })) : [{ weekNumber: 1, topicName: "", description: "", hours: 2 }],
      duration: p.duration, planGoal: p.goal,
      objectives: p.objectives.length ? [...p.objectives] : [""],
      lessonForm: p.lessonForm,
      methods: p.methods.length ? [...p.methods] : [""],
      materials: p.materials.length ? [...p.materials] : [""],
      steps: p.steps.length ? p.steps.map(s => ({ ...s })) : [{ time: "", phase: "", teacherActivity: "", studentActivity: "", methods: "", assessment: "" }],
      homework: p.homework, reflection: p.reflection,
      criteria: isCriteriaArray(c.criteria) ? c.criteria.map(cr => ({ ...cr })) : [{ name: "", percentage: 0, description: "" }],
    };
  }
  return { ...emptyForm(), name: c.name, goal: c.goal };
}

function formToCurriculum(form: EditForm, id: string, subjectId: string, createdAt: string): Curriculum {
  const plan: LessonPlan = {
    subject: "", grade: "11-р анги", chapter: form.chapter,
    topicSchedule: form.topicSchedule.filter(t => t.topicName.trim()),
    duration: form.duration, goal: form.planGoal,
    objectives: form.objectives.filter(o => o.trim()),
    lessonForm: form.lessonForm,
    methods: form.methods.filter(m => m.trim()),
    materials: form.materials.filter(m => m.trim()),
    steps: form.steps, homework: form.homework, reflection: form.reflection,
  };
  return { id, subjectId, name: form.name, goal: form.goal, content: plan, criteria: form.criteria.filter(c => c.name.trim()), weeks: 10, createdAt };
}

export default function CurriculumTab({ subjectId, curricula, onUpdate }: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EditForm>(emptyForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function openNew() { setForm(emptyForm()); setEditId(null); setShowForm(true); }
  function openEdit(c: Curriculum) { setForm(curriculumToForm(c)); setEditId(c.id); setShowForm(true); }

  function save() {
    if (!form.name.trim()) return;
    const curriculum = formToCurriculum(form, editId || crypto.randomUUID(), subjectId,
      editId ? curricula.find(c => c.id === editId)!.createdAt : new Date().toISOString());
    store.saveCurriculum(curriculum);
    setShowForm(false); setForm(emptyForm()); setEditId(null); onUpdate();
  }

  function remove(id: string) { if (!confirm("Устгах уу?")) return; store.deleteCurriculum(id); onUpdate(); }

  function handleDownloadPdf(c: Curriculum) {
    if (isLessonPlan(c.content)) downloadLessonPlanPdf(c.content, isCriteriaArray(c.criteria) ? c.criteria : undefined);
  }

  function updateArr<T>(arr: T[], i: number, val: T): T[] { const n = [...arr]; n[i] = val; return n; }
  function removeArr<T>(arr: T[], i: number): T[] { return arr.filter((_, idx) => idx !== i); }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-700">Нэгж хөтөлбөрүүд</h2>
        <div className="flex gap-2">
          {curricula.length > 0 && (
            <button onClick={() => { if (confirm("Бүх хөтөлбөрийг устгах уу?")) { curricula.forEach(c => store.deleteCurriculum(c.id)); onUpdate(); } }}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
              Бүгдийг устгах
            </button>
          )}
          <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Хөтөлбөр нэмэх</button>
        </div>
      </div>

      {/* ============ EDIT FORM ============ */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-5">
          <h3 className="text-base font-semibold">{editId ? "Хөтөлбөр засах" : "Шинэ хөтөлбөр"}</h3>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Нэр</Label><Input value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Нэгж хөтөлбөр - Бүлэг 1. Механик" /></div>
            <div><Label>Бүлэг</Label><Input value={form.chapter} onChange={v => setForm({ ...form, chapter: v })} placeholder="Бүлэг 1. Механик" /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Хөтөлбөрийн зорилго</Label><TextArea value={form.goal} onChange={v => setForm({ ...form, goal: v })} rows={2} placeholder="Ерөнхий зорилго..." /></div>
            <div><Label>Хичээлийн зорилго</Label><TextArea value={form.planGoal} onChange={v => setForm({ ...form, planGoal: v })} rows={2} placeholder="Сурагчид юу мэдэж, чаддаг болох..." /></div>
          </div>

          {/* Topic Schedule - 10 week plan */}
          <div>
            <Label>Сэдвийн хуваарь (10 долоо хоног)</Label>
            <div className="overflow-x-auto mt-1">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-blue-50">
                  <th className="border border-slate-200 px-2 py-1.5 text-left w-20">7 хоног</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-left">Сэдвийн нэр</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-left">Тайлбар</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-left w-14">Цаг</th>
                  <th className="border border-slate-200 px-1 py-1.5 w-6"></th>
                </tr></thead>
                <tbody>
                  {form.topicSchedule.map((t, i) => (
                    <tr key={i}>
                      <td className="border border-slate-200 p-0.5">
                        <input type="number" min={1} max={10} className="w-full px-1 py-1 text-xs border-0 focus:outline-none text-center" value={t.weekNumber}
                          onChange={e => setForm({ ...form, topicSchedule: updateArr(form.topicSchedule, i, { ...t, weekNumber: Number(e.target.value) }) })} />
                      </td>
                      <td className="border border-slate-200 p-0.5">
                        <input className="w-full px-1 py-1 text-xs border-0 focus:outline-none" value={t.topicName}
                          onChange={e => setForm({ ...form, topicSchedule: updateArr(form.topicSchedule, i, { ...t, topicName: e.target.value }) })} placeholder="Сэдвийн нэр" />
                      </td>
                      <td className="border border-slate-200 p-0.5">
                        <input className="w-full px-1 py-1 text-xs border-0 focus:outline-none" value={t.description}
                          onChange={e => setForm({ ...form, topicSchedule: updateArr(form.topicSchedule, i, { ...t, description: e.target.value }) })} placeholder="Тайлбар" />
                      </td>
                      <td className="border border-slate-200 p-0.5">
                        <input type="number" min={1} className="w-full px-1 py-1 text-xs border-0 focus:outline-none text-center" value={t.hours}
                          onChange={e => setForm({ ...form, topicSchedule: updateArr(form.topicSchedule, i, { ...t, hours: Number(e.target.value) }) })} />
                      </td>
                      <td className="border border-slate-200 p-0.5 text-center">
                        {form.topicSchedule.length > 1 && <button onClick={() => setForm({ ...form, topicSchedule: removeArr(form.topicSchedule, i) })} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setForm({ ...form, topicSchedule: [...form.topicSchedule, { weekNumber: form.topicSchedule.length + 1, topicName: "", description: "", hours: 2 }] })}
              className="text-blue-600 text-xs font-medium mt-1">+ Сэдэв нэмэх</button>
          </div>

          {/* Objectives */}
          <div>
            <Label>Зорилтууд</Label>
            {form.objectives.map((obj, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <Input value={obj} onChange={v => setForm({ ...form, objectives: updateArr(form.objectives, i, v) })} placeholder={`Зорилт ${i + 1}`} />
                {form.objectives.length > 1 && <button onClick={() => setForm({ ...form, objectives: removeArr(form.objectives, i) })} className="text-red-400 hover:text-red-600 px-1">✕</button>}
              </div>
            ))}
            <button onClick={() => setForm({ ...form, objectives: [...form.objectives, ""] })} className="text-blue-600 text-xs font-medium mt-1">+ Зорилт нэмэх</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Хичээлийн хэлбэр</Label><Input value={form.lessonForm} onChange={v => setForm({ ...form, lessonForm: v })} placeholder="Лекц-семинар" /></div>
            <div><Label>Хугацаа</Label><Input value={form.duration} onChange={v => setForm({ ...form, duration: v })} placeholder="80 минут (2 цаг)" /></div>
          </div>

          {/* Methods & Materials */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Арга технологи</Label>
              {form.methods.map((m, i) => (
                <div key={i} className="flex gap-2 mb-1">
                  <Input value={m} onChange={v => setForm({ ...form, methods: updateArr(form.methods, i, v) })} placeholder={`Арга ${i + 1}`} />
                  {form.methods.length > 1 && <button onClick={() => setForm({ ...form, methods: removeArr(form.methods, i) })} className="text-red-400 hover:text-red-600 px-1">✕</button>}
                </div>
              ))}
              <button onClick={() => setForm({ ...form, methods: [...form.methods, ""] })} className="text-blue-600 text-xs font-medium mt-1">+ Арга нэмэх</button>
            </div>
            <div>
              <Label>Хэрэглэгдэхүүн</Label>
              {form.materials.map((m, i) => (
                <div key={i} className="flex gap-2 mb-1">
                  <Input value={m} onChange={v => setForm({ ...form, materials: updateArr(form.materials, i, v) })} placeholder={`Хэрэглэгдэхүүн ${i + 1}`} />
                  {form.materials.length > 1 && <button onClick={() => setForm({ ...form, materials: removeArr(form.materials, i) })} className="text-red-400 hover:text-red-600 px-1">✕</button>}
                </div>
              ))}
              <button onClick={() => setForm({ ...form, materials: [...form.materials, ""] })} className="text-blue-600 text-xs font-medium mt-1">+ Нэмэх</button>
            </div>
          </div>

          {/* Steps */}
          <div>
            <Label>Хичээлийн үйл явц</Label>
            <div className="overflow-x-auto mt-1">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-blue-50">
                  <th className="border border-slate-200 px-2 py-1.5 w-16">Хугацаа</th>
                  <th className="border border-slate-200 px-2 py-1.5 w-28">Үе шат</th>
                  <th className="border border-slate-200 px-2 py-1.5">Багш</th>
                  <th className="border border-slate-200 px-2 py-1.5">Сурагч</th>
                  <th className="border border-slate-200 px-2 py-1.5 w-24">Арга</th>
                  <th className="border border-slate-200 px-2 py-1.5 w-24">Үнэлгээ</th>
                  <th className="border border-slate-200 px-1 py-1.5 w-6"></th>
                </tr></thead>
                <tbody>
                  {form.steps.map((s, i) => (
                    <tr key={i}>
                      {(["time","phase","teacherActivity","studentActivity","methods","assessment"] as const).map(k => (
                        <td key={k} className="border border-slate-200 p-0.5">
                          <input className="w-full px-1 py-1 text-xs border-0 focus:outline-none" value={s[k]}
                            onChange={e => setForm({ ...form, steps: updateArr(form.steps, i, { ...s, [k]: e.target.value }) })} />
                        </td>
                      ))}
                      <td className="border border-slate-200 p-0.5 text-center">
                        {form.steps.length > 1 && <button onClick={() => setForm({ ...form, steps: removeArr(form.steps, i) })} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setForm({ ...form, steps: [...form.steps, { time: "", phase: "", teacherActivity: "", studentActivity: "", methods: "", assessment: "" }] })}
              className="text-blue-600 text-xs font-medium mt-1">+ Алхам нэмэх</button>
          </div>

          {/* Homework & Reflection */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Гэрийн даалгавар</Label><TextArea value={form.homework} onChange={v => setForm({ ...form, homework: v })} rows={2} /></div>
            <div><Label>Эргэцүүлэл</Label><TextArea value={form.reflection} onChange={v => setForm({ ...form, reflection: v })} rows={2} /></div>
          </div>

          {/* Criteria */}
          <div>
            <Label>Үнэлгээний шалгуур</Label>
            {form.criteria.map((cr, i) => (
              <div key={i} className="flex gap-2 items-center mb-1">
                <input className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-sm" value={cr.name}
                  onChange={e => setForm({ ...form, criteria: updateArr(form.criteria, i, { ...cr, name: e.target.value }) })} placeholder="Шалгуур" />
                <input type="number" className="w-16 border border-slate-300 rounded px-2 py-1.5 text-sm text-center" value={cr.percentage} min={0} max={100}
                  onChange={e => setForm({ ...form, criteria: updateArr(form.criteria, i, { ...cr, percentage: Number(e.target.value) }) })} />
                <input className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-sm" value={cr.description}
                  onChange={e => setForm({ ...form, criteria: updateArr(form.criteria, i, { ...cr, description: e.target.value }) })} placeholder="Тайлбар" />
                {form.criteria.length > 1 && <button onClick={() => setForm({ ...form, criteria: removeArr(form.criteria, i) })} className="text-red-400 hover:text-red-600">✕</button>}
              </div>
            ))}
            <button onClick={() => setForm({ ...form, criteria: [...form.criteria, { name: "", percentage: 0, description: "" }] })}
              className="text-blue-600 text-xs font-medium mt-1">+ Шалгуур нэмэх</button>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={save} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Хадгалах</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="bg-slate-100 text-slate-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-200">Болих</button>
          </div>
        </div>
      )}

      {/* Empty */}
      {curricula.length === 0 && !showForm && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          Хөтөлбөр байхгүй байна.
        </div>
      )}

      {/* ============ LIST ============ */}
      <div className="space-y-3">
        {curricula.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
              <div>
                <h4 className="font-medium text-slate-800">{c.name}</h4>
                {isLessonPlan(c.content) && c.content.topicSchedule?.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">{c.content.topicSchedule.length} сэдэв • 10 долоо хоног</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isLessonPlan(c.content) && (
                  <button onClick={e => { e.stopPropagation(); handleDownloadPdf(c); }}
                    className="text-green-600 hover:text-green-700 text-sm px-2 py-1 bg-green-50 rounded-md font-medium">PDF татах</button>
                )}
                <button onClick={e => { e.stopPropagation(); openEdit(c); }} className="text-slate-400 hover:text-blue-600 text-sm px-2 py-1">Засах</button>
                <button onClick={e => { e.stopPropagation(); remove(c.id); }} className="text-slate-400 hover:text-red-600 text-sm px-2 py-1">Устгах</button>
                <span className="text-slate-300 ml-2">{expandedId === c.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {expandedId === c.id && (
              <div className="border-t border-slate-100 p-4 space-y-5 bg-slate-50/50">
                {isLessonPlan(c.content) ? (
                  <LessonPlanView plan={c.content} criteria={isCriteriaArray(c.criteria) ? c.criteria : undefined} />
                ) : (
                  <>
                    {c.goal && <div><SLabel>Зорилго</SLabel><p className="text-sm text-slate-700 mt-1">{c.goal}</p></div>}
                    {c.content && <div><SLabel>Агуулга</SLabel><p className="text-sm text-slate-700 whitespace-pre-wrap">{typeof c.content === "string" ? c.content : JSON.stringify(c.content, null, 2)}</p></div>}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ VIEW ============

function LessonPlanView({ plan, criteria }: { plan: LessonPlan; criteria?: CriteriaItem[] }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <InfoBox label="Хичээл" value={plan.subject} />
        <InfoBox label="Анги" value={plan.grade} />
        <InfoBox label="Бүлэг" value={plan.chapter || plan.topic || ""} />
        <InfoBox label="Хугацаа" value={plan.duration} />
      </div>

      <div><SLabel>Зорилго</SLabel><p className="text-sm text-slate-700 mt-1">{plan.goal}</p></div>

      <div>
        <SLabel>Зорилтууд</SLabel>
        <ul className="mt-1 space-y-1">
          {plan.objectives.map((obj, i) => <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-blue-500">•</span>{obj}</li>)}
        </ul>
      </div>

      {/* Topic Schedule - the main table */}
      {plan.topicSchedule && plan.topicSchedule.length > 0 && (
        <div>
          <SLabel>Сэдвийн хуваарь (10 долоо хоног)</SLabel>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-indigo-50">
                <th className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700 w-24">Долоо хоног</th>
                <th className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Сэдэв</th>
                <th className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Тайлбар</th>
                <th className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700 w-16">Цаг</th>
              </tr></thead>
              <tbody>
                {plan.topicSchedule.map((t, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="border border-slate-200 px-3 py-2 text-center">
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{t.weekNumber}-р</span>
                    </td>
                    <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800">{t.topicName}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600">{t.description}</td>
                    <td className="border border-slate-200 px-3 py-2 text-center text-slate-600">{t.hours}</td>
                  </tr>
                ))}
                <tr className="bg-indigo-50 font-semibold">
                  <td className="border border-slate-200 px-3 py-2 text-center">Нийт</td>
                  <td className="border border-slate-200 px-3 py-2">{plan.topicSchedule.length} сэдэв</td>
                  <td className="border border-slate-200 px-3 py-2"></td>
                  <td className="border border-slate-200 px-3 py-2 text-center">{plan.topicSchedule.reduce((s, t) => s + t.hours, 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div><SLabel>Хичээлийн хэлбэр</SLabel><p className="text-sm text-slate-700 mt-1">{plan.lessonForm}</p></div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <SLabel>Арга технологи</SLabel>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {plan.methods.map((m, i) => <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">{m}</span>)}
          </div>
        </div>
        <div>
          <SLabel>Хэрэглэгдэхүүн</SLabel>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {plan.materials.map((m, i) => <span key={i} className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full">{m}</span>)}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div>
        <SLabel>Хичээлийн үйл явц</SLabel>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-blue-50">
              <th className="border border-slate-200 px-3 py-2 text-left font-semibold w-16">Хугацаа</th>
              <th className="border border-slate-200 px-3 py-2 text-left font-semibold w-32">Үе шат</th>
              <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Багш</th>
              <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Сурагч</th>
              <th className="border border-slate-200 px-3 py-2 text-left font-semibold w-24">Арга</th>
              <th className="border border-slate-200 px-3 py-2 text-left font-semibold w-24">Үнэлгээ</th>
            </tr></thead>
            <tbody>
              {plan.steps.map((s, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="border border-slate-200 px-3 py-2 font-medium text-blue-700 text-center">{s.time}</td>
                  <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800">{s.phase}</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-600">{s.teacherActivity}</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-600">{s.studentActivity}</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-500 text-xs">{s.methods}</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-500 text-xs">{s.assessment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {plan.homework && <div><SLabel>Гэрийн даалгавар</SLabel><p className="text-sm text-slate-700 mt-1">{plan.homework}</p></div>}
      {plan.reflection && <div><SLabel>Эргэцүүлэл</SLabel><p className="text-sm text-slate-700 mt-1 italic">{plan.reflection}</p></div>}
      {criteria && criteria.length > 0 && <CriteriaTable criteria={criteria} />}
    </div>
  );
}

function CriteriaTable({ criteria }: { criteria: CriteriaItem[] }) {
  return (
    <div>
      <SLabel>Үнэлгээний шалгуур</SLabel>
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-green-50">
            <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Шалгуур</th>
            <th className="border border-slate-200 px-3 py-2 text-center font-semibold w-24">Хувь</th>
            <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Тайлбар</th>
          </tr></thead>
          <tbody>
            {criteria.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="border border-slate-200 px-3 py-2 font-medium">{r.name}</td>
                <td className="border border-slate-200 px-3 py-2 text-center"><span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{r.percentage}%</span></td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">{r.description}</td>
              </tr>
            ))}
            <tr className="bg-green-50 font-semibold">
              <td className="border border-slate-200 px-3 py-2">Нийт</td>
              <td className="border border-slate-200 px-3 py-2 text-center text-green-700">{criteria.reduce((s, r) => s + r.percentage, 0)}%</td>
              <td className="border border-slate-200 px-3 py-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ SMALL COMPONENTS ============
function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="bg-white rounded-lg border border-slate-200 px-3 py-2"><span className="text-xs text-slate-400">{label}</span><p className="text-sm font-medium text-slate-800">{value}</p></div>;
}
function SLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{children}</span>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1">{children}</label>;
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />;
}
function TextArea({ value, onChange, rows }: { value: string; onChange: (v: string) => void; rows: number; placeholder?: string }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />;
}
