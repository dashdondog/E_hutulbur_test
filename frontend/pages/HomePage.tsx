"use client";

import TeacherOverviewChart from "@/frontend/components/TeacherOverviewChart";

export default function HomePage() {
  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            Хөтөлбөр бэлдэх & Сэдэв сэдвээр тест бэлтгэх
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2">
            Сургалтын хөтөлбөр боловсруулах болон тест бэлтгэх үйл ажиллагааг дэмжих хиймэл оюунд суурилсан системийн хөгжүүлэлт
          </p>
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
