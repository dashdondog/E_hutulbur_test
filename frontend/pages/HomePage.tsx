"use client";

import Link from "next/link";
import { useAuth } from "@/frontend/lib/auth-context";
import { subjects } from "@/shared/subjects";
import TeacherOverviewChart from "@/frontend/components/TeacherOverviewChart";
import { BookOpen, ClipboardCheck, BarChart3, Sparkles, Users, ArrowRight } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Хөтөлбөр боловсруулах",
    desc: "Хиймэл оюуны тусламжтайгаар сургалтын хөтөлбөр, сэдвүүдийг хурдан бэлтгэнэ.",
  },
  {
    icon: ClipboardCheck,
    title: "Сэдэв сэдвээр тест",
    desc: "Сэдэв бүрээр тест автоматаар үүсгэж, ангидаа хуваарилна.",
  },
  {
    icon: BarChart3,
    title: "Дүнгийн хяналт",
    desc: "Сурагчдын үр дүнг хичээл, сэдвээр нь харж, хоцрогдлыг эрт илрүүлнэ.",
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Өглөөний мэнд";
  if (h < 18) return "Өдрийн мэнд";
  return "Оройн мэнд";
}

function Hero({ greeting, actions }: { greeting?: string; actions: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-sidebar)] text-white p-6 sm:p-10 mb-6 sm:mb-8 shadow-lg">
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 right-24 w-48 h-48 rounded-full bg-[var(--color-accent)]/20 blur-2xl pointer-events-none" />

      <div className="relative max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
          <Sparkles size={14} className="text-[var(--color-accent)]" />
          Хиймэл оюунд суурилсан систем
        </span>
        {greeting && (
          <p className="mt-4 text-white/80 text-sm sm:text-base">{greeting} 👋</p>
        )}
        <h1 className={`${greeting ? "mt-1" : "mt-4"} text-2xl sm:text-4xl font-bold leading-tight`}>
          Хөтөлбөр бэлдэх & Сэдэв сэдвээр тест бэлтгэх
        </h1>
        <p className="mt-3 text-white/85 text-sm sm:text-base leading-relaxed">
          Сургалтын хөтөлбөр боловсруулах болон тест бэлтгэх үйл ажиллагааг дэмжих хиймэл оюунд суурилсан систем.
          Цаг хэмнэж, сурагч бүрийн ахицыг нэг дороос хянаарай.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {features.map(({ icon: Icon, title, desc }) => (
        <div
          key={title}
          className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/15 flex items-center justify-center mb-3">
            <Icon size={20} className="text-[var(--color-primary)]" />
          </div>
          <h3 className="font-semibold text-[var(--color-text)]">{title}</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>
  );
}

const primaryBtn =
  "inline-flex items-center gap-2 rounded-lg bg-white text-[var(--color-primary-dark)] px-4 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors";
const secondaryBtn =
  "inline-flex items-center gap-2 rounded-lg bg-white/15 border border-white/25 px-4 py-2.5 text-sm font-semibold hover:bg-white/25 transition-colors";

// Public landing page for visitors who are not logged in
function Landing() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="max-w-6xl mx-auto flex items-center px-4 sm:px-8 py-5">
        <div className="flex items-center gap-2 font-bold text-lg text-[var(--color-text)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          AI-EDU
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pb-12">
        <Hero
          actions={
            <Link href="/login" className={primaryBtn}>
              Эхлэх
              <ArrowRight size={16} />
            </Link>
          }
        />
        <Features />
      </main>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  if (!user) return <Landing />;

  const firstSubject = subjects.find((s) => user.teacherSubjects?.includes(s.id));

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <Hero
          greeting={`${getGreeting()}, ${user.name}`}
          actions={
            <>
              <Link href="/classrooms" className={primaryBtn}>
                <Users size={16} />
                Ангиуд руу орох
              </Link>
              <Link href={firstSubject ? `/subjects/${firstSubject.id}` : "/settings"} className={secondaryBtn}>
                {firstSubject ? `${firstSubject.name} хичээл` : "Хичээл сонгох"}
                <ArrowRight size={16} />
              </Link>
            </>
          }
        />
        <Features />

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
