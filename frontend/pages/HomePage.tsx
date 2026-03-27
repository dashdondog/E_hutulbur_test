"use client";

import { subjects } from "@/shared/subjects";
import { useEffect, useState } from "react";
import { getStats } from "@/frontend/lib/store";
import { BookOpen, FileText, ClipboardList, HelpCircle } from "lucide-react";
import TeacherOverviewChart from "@/frontend/components/TeacherOverviewChart";

export default function HomePage() {
  const [stats, setStats] = useState({
    totalTopics: 0,
    totalTests: 0,
    totalQuestions: 0,
  });

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            11-р ангийн хичээлийн систем
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2">
            Хөтөлбөр бэлдэх & Сэдэв сэдвээр тест бэлтгэх
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard icon={BookOpen} label="Хичээл" value={subjects.length} color="#007ba7" />
          <StatCard icon={FileText} label="Нийт сэдэв" value={stats.totalTopics} color="#007ba7" />
          <StatCard icon={ClipboardList} label="Нийт тест" value={stats.totalTests} color="#ffbf00" />
          <StatCard icon={HelpCircle} label="Нийт асуулт" value={stats.totalQuestions} color="#ffbf00" />
        </div>

        {/* Student Results Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
            Сурагчдын дүнгийн хяналт
          </h2>
          <TeacherOverviewChart />
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string; value: number; color: string }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-[var(--color-text)]">{value}</div>
        <div className="text-sm text-[var(--color-text-secondary)]">{label}</div>
      </div>
    </div>
  );
}
