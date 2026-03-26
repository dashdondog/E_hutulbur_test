"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { subjects } from "@/shared/subjects";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-[var(--color-sidebar)] text-white flex flex-col shrink-0">
      <Link href="/" className="block p-5 border-b border-white/10">
        <h1 className="text-lg font-bold">📚 11-р ангийн</h1>
        <p className="text-sm text-slate-400 mt-1">Хичээлийн систем</p>
      </Link>
      <nav className="flex-1 overflow-y-auto py-2">
        {subjects.map((subject) => {
          const isActive = pathname.startsWith(`/subjects/${subject.id}`);
          return (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-white/15 text-white font-medium"
                  : "text-slate-300 hover:bg-[var(--color-sidebar-hover)] hover:text-white"
              }`}
            >
              <span className="text-lg">{subject.icon}</span>
              <span>{subject.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10 text-xs text-slate-500">
        16 хичээл • 11-р анги
      </div>
    </aside>
  );
}
