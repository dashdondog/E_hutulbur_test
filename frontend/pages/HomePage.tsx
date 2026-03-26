"use client";

import Link from "next/link";
import { subjects } from "@/shared/subjects";
import { useEffect, useState } from "react";
import { getStats } from "@/frontend/lib/store";

export default function HomePage() {
  const [stats, setStats] = useState({
    totalTopics: 0,
    totalTests: 0,
    totalQuestions: 0,
  });

  useEffect(() => {
    setStats(getStats());
  }, []);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            11-р ангийн хичээлийн систем
          </h1>
          <p className="text-slate-500 mt-2">
            Хөтөлбөр бэлдэх & Сэдэв сэдвээр тест бэлтгэх
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="text-3xl font-bold text-blue-600">16</div>
            <div className="text-sm text-slate-500 mt-1">Хичээл</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="text-3xl font-bold text-green-600">
              {stats.totalTopics}
            </div>
            <div className="text-sm text-slate-500 mt-1">Нийт сэдэв</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="text-3xl font-bold text-purple-600">
              {stats.totalTests}
            </div>
            <div className="text-sm text-slate-500 mt-1">Нийт тест</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="text-3xl font-bold text-orange-600">
              {stats.totalQuestions}
            </div>
            <div className="text-sm text-slate-500 mt-1">Нийт асуулт</div>
          </div>
        </div>

        {/* Subjects Grid */}
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Хичээлүүд
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all group"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-3"
                style={{ backgroundColor: subject.color + "15" }}
              >
                {subject.icon}
              </div>
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                {subject.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                11-р ангийн сурах бичиг
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
