"use client";

import { useMemo } from "react";
import { TestResult } from "@/shared/types";
import { subjects } from "@/shared/subjects";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Award, Target } from "lucide-react";

interface Props {
  results: TestResult[];
}

export default function StudentProgressChart({ results }: Props) {
  // Sort results by date (oldest first for the line chart)
  const sortedResults = useMemo(
    () => [...results].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()),
    [results]
  );

  // Line chart data: progress over time
  const progressData = useMemo(
    () =>
      sortedResults.map((r, i) => ({
        name: new Date(r.submittedAt).toLocaleDateString("mn-MN", { month: "short", day: "numeric" }),
        percentage: r.percentage,
        avg: Math.round(
          sortedResults.slice(0, i + 1).reduce((s, x) => s + x.percentage, 0) / (i + 1)
        ),
        testName: r.testName,
      })),
    [sortedResults]
  );

  // Bar chart data: score per subject
  const subjectData = useMemo(() => {
    const map = new Map<string, { total: number; count: number; color: string; name: string }>();
    results.forEach((r) => {
      const sub = subjects.find((s) => s.id === r.subjectId);
      const existing = map.get(r.subjectId) || { total: 0, count: 0, color: sub?.color || "#64748B", name: sub?.name || r.subjectId };
      existing.total += r.percentage;
      existing.count += 1;
      map.set(r.subjectId, existing);
    });
    return Array.from(map.entries()).map(([, v]) => ({
      name: v.name.length > 8 ? v.name.slice(0, 8) + "…" : v.name,
      fullName: v.name,
      avg: Math.round(v.total / v.count),
      count: v.count,
      color: v.color,
    }));
  }, [results]);

  // Pie chart data: pass/fail distribution
  const pieData = useMemo(() => {
    const pass = results.filter((r) => r.percentage >= 60).length;
    const fail = results.length - pass;
    return [
      { name: "Тэнцсэн", value: pass, color: "#007ba7" },
      { name: "Тэнцээгүй", value: fail, color: "#EF4444" },
    ];
  }, [results]);

  // Stats
  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;
  const bestScore = results.length > 0 ? Math.max(...results.map((r) => r.percentage)) : 0;
  const latestResults = sortedResults.slice(-5);
  const trend = latestResults.length >= 2
    ? latestResults[latestResults.length - 1].percentage - latestResults[0].percentage
    : 0;

  if (results.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center">
        <Target size={40} className="mx-auto text-[var(--color-text-muted)] mb-3" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Тест өгсний дараа ахиц дэвшлийн график энд харагдана.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Дундаж оноо" value={`${avgScore}%`} color={avgScore >= 60 ? "text-green-500" : "text-red-500"} />
        <MiniStat label="Шилдэг оноо" value={`${bestScore}%`} color="text-[var(--color-primary)]" />
        <MiniStat label="Нийт тест" value={String(results.length)} color="text-[var(--color-text)]" />
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)] uppercase">Чиг хандлага</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {trend > 0 ? (
              <TrendingUp size={18} className="text-green-500" />
            ) : trend < 0 ? (
              <TrendingDown size={18} className="text-red-500" />
            ) : (
              <Minus size={18} className="text-[var(--color-text-muted)]" />
            )}
            <span className={`text-xl sm:text-2xl font-bold ${
              trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-[var(--color-text-muted)]"
            }`}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Progress over time */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[var(--color-primary)]" />
            Ахиц дэвшил
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
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
                  labelStyle={{ color: "var(--color-text)", fontWeight: 600 }}
                  formatter={(value, name) => [
                    `${value}%`,
                    name === "percentage" ? "Оноо" : "Дундаж",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#007ba7"
                  strokeWidth={2.5}
                  dot={{ fill: "#007ba7", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="percentage"
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#8a8a9e"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="avg"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score by subject */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <Award size={16} className="text-[var(--color-primary)]" />
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

        {/* Pass/Fail pie chart */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">
            Тэнцсэн / Тэнцээгүй
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
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
                    <span style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent results list */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">
            Сүүлийн тестүүд
          </h3>
          <div className="space-y-2">
            {[...results]
              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .slice(0, 5)
              .map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border-light)] last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{r.testName}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {subjects.find((s) => s.id === r.subjectId)?.name} • {new Date(r.submittedAt).toLocaleDateString("mn-MN")}
                    </p>
                  </div>
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full shrink-0 ml-2 ${
                    r.percentage >= 70
                      ? "bg-green-500/10 text-green-500"
                      : r.percentage >= 40
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-red-500/10 text-red-500"
                  }`}>
                    {r.percentage}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 sm:p-4">
      <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)] uppercase">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
