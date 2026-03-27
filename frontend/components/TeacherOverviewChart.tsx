"use client";

import { useState, useEffect, useMemo } from "react";
import { TestResult } from "@/shared/types";
import { subjects } from "@/shared/subjects";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { Users, Award, TrendingUp, AlertTriangle } from "lucide-react";

export default function TeacherOverviewChart() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/test-results")
      .then((res) => res.json())
      .then((data) => setResults(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Stats
  const uniqueStudents = useMemo(() => new Set(results.map((r) => r.userId)).size, [results]);
  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;
  const passRate = results.length > 0
    ? Math.round((results.filter((r) => r.percentage >= 60).length / results.length) * 100)
    : 0;
  const lowScorers = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    results.forEach((r) => {
      const e = map.get(r.userId) || { name: r.userName, total: 0, count: 0 };
      e.total += r.percentage;
      e.count += 1;
      map.set(r.userId, e);
    });
    return Array.from(map.values())
      .map((v) => ({ ...v, avg: Math.round(v.total / v.count) }))
      .filter((v) => v.avg < 60)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 5);
  }, [results]);

  // Subject averages
  const subjectData = useMemo(() => {
    const map = new Map<string, { total: number; count: number; color: string; name: string }>();
    results.forEach((r) => {
      const sub = subjects.find((s) => s.id === r.subjectId);
      const e = map.get(r.subjectId) || { total: 0, count: 0, color: sub?.color || "#64748B", name: sub?.name || r.subjectId };
      e.total += r.percentage;
      e.count += 1;
      map.set(r.subjectId, e);
    });
    return Array.from(map.entries()).map(([, v]) => ({
      name: v.name.length > 8 ? v.name.slice(0, 8) + "…" : v.name,
      fullName: v.name,
      avg: Math.round(v.total / v.count),
      count: v.count,
      color: v.color,
    }));
  }, [results]);

  // Score distribution
  const distData = useMemo(() => {
    const ranges = [
      { name: "90-100%", min: 90, max: 100, color: "#007ba7" },
      { name: "70-89%", min: 70, max: 89, color: "#33a0c4" },
      { name: "60-69%", min: 60, max: 69, color: "#ffbf00" },
      { name: "40-59%", min: 40, max: 59, color: "#F97316" },
      { name: "0-39%", min: 0, max: 39, color: "#EF4444" },
    ];
    return ranges.map((r) => ({
      ...r,
      value: results.filter((x) => x.percentage >= r.min && x.percentage <= r.max).length,
    }));
  }, [results]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center">
        <Users size={40} className="mx-auto text-[var(--color-text-muted)] mb-3" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Сурагчдын тестийн дүн байхгүй байна.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat icon={Users} label="Сурагчид" value={String(uniqueStudents)} color="text-[var(--color-primary)]" />
        <MiniStat icon={Award} label="Нийт дүн" value={String(results.length)} color="text-[var(--color-primary)]" />
        <MiniStat icon={TrendingUp} label="Дундаж оноо" value={`${avgScore}%`} color={avgScore >= 60 ? "text-green-500" : "text-red-500"} />
        <MiniStat icon={AlertTriangle} label="Тэнцсэн хувь" value={`${passRate}%`} color={passRate >= 70 ? "text-green-500" : "text-[var(--color-accent)]"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subject averages bar chart */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">
            Хичээл тус бүрийн дундаж
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                  axisLine={{ stroke: "var(--color-border)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={{ stroke: "var(--color-border)" }}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value}%`, "Дундаж"]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullName || label;
                  }}
                />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {subjectData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score distribution pie */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">
            Оноон тархалт
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {distData
                    .filter((d) => d.value > 0)
                    .map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [value, "Тест"]}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "var(--color-text-secondary)", fontSize: 11 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low scorers alert */}
        {lowScorers.length > 0 && (
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Анхаарал хандуулах сурагчид (дундаж &lt;60%)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowScorers.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-alt)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-xs font-bold">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{s.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{s.count} тест</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-500">{s.avg}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 sm:p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={14} className={color} />
        <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)] uppercase">{label}</p>
      </div>
      <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
