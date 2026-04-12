"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { subjects } from "@/shared/subjects";
import { useAuth } from "@/frontend/lib/auth-context";
import { BarChart3, Users, KeyRound, Settings } from "lucide-react";
import SubjectIcon from "./SubjectIcon";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || user.role === "admin") return null;

  return (
    <aside className="w-64 h-screen bg-[var(--color-sidebar)] text-white flex flex-col shrink-0 overflow-y-auto">
      <Link href={user.role === "student" ? "/student" : "/"} className="block p-5 border-b border-white/10">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          AI-EDU 
        </h1>
        <p className="text-sm text-slate-400 mt-1 ml-10">Хичээлийн систем</p>
      </Link>

      <nav className="flex-1 overflow-y-auto py-2">
        {user.role === "teacher" ? (
          <>
            <Link
              href="/classrooms"
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                pathname.startsWith("/classrooms")
                  ? "bg-white/15 text-white font-medium"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center">
                <Users size={16} className="text-[var(--color-primary-light)]" />
              </div>
              <span>Ангиуд</span>
            </Link>
            <div className="border-b border-white/10 my-1" />
            {user.teacherSubjects && user.teacherSubjects.length > 0 ? (
              subjects.filter((s) => user.teacherSubjects!.includes(s.id)).map((subject) => {
                const isActive = pathname.startsWith(`/subjects/${subject.id}`);
                return (
                  <Link
                    key={subject.id}
                    href={`/subjects/${subject.id}`}
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-all ${
                      isActive
                        ? "bg-white/15 text-white font-medium"
                        : "text-slate-300 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <SubjectIcon icon={subject.icon} color={isActive ? "#fff" : subject.color} size="sm" />
                    <span>{subject.name}</span>
                  </Link>
                );
              })
            ) : (
              <Link href="/settings" className="flex items-center gap-2 px-4 py-3 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                + Тохиргооноос хичээл сонгоно уу
              </Link>
            )}
            <div className="border-b border-white/10 my-1" />
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                pathname === "/settings"
                  ? "bg-white/15 text-white font-medium"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Settings size={16} className="text-slate-300" />
              </div>
              <span>Тохиргоо</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/student/classrooms"
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                pathname.startsWith("/student/classrooms")
                  ? "bg-white/15 text-white font-medium"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center">
                <Users size={16} className="text-[var(--color-primary-light)]" />
              </div>
              <span>Миний хичээл</span>
            </Link>
            <Link
              href="/student"
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                pathname === "/student"
                  ? "bg-white/15 text-white font-medium"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/20 flex items-center justify-center">
                <BarChart3 size={16} className="text-[var(--color-accent)]" />
              </div>
              <span>Миний дүнгүүд</span>
            </Link>
            <Link
              href="/student/change-password"
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                pathname === "/student/change-password"
                  ? "bg-white/15 text-white font-medium"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <KeyRound size={16} className="text-slate-300" />
              </div>
              <span>Нууц үг солих</span>
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/10 text-xs text-slate-500">
        {subjects.length} хичээл • 11-р анги
      </div>
    </aside>
  );
}
