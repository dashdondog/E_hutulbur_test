"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/frontend/lib/auth-context";
import { useTheme } from "@/frontend/lib/theme-context";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import GlobalSearch from "./GlobalSearch";
import { Menu, X, Sun, Moon } from "lucide-react";

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] rounded-lg px-3 py-1.5 transition-colors"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
          user.role === "teacher" ? "bg-[var(--color-primary)]" : "bg-[var(--color-accent)]"
        }`}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-[var(--color-text)] leading-tight">{user.name}</p>
        </div>
        <svg className="w-4 h-4 text-[var(--color-text-muted)] hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--color-surface)] rounded-xl shadow-lg border border-[var(--color-border)] py-2 z-50">
          <div className="px-4 py-2 border-b border-[var(--color-border-light)]">
            <p className="text-sm font-medium text-[var(--color-text)]">{user.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
          </div>
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            Гарах
          </button>
        </div>
      )}
    </div>
  );
}

function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
      title={theme === "dark" ? "Цайвар горим" : "Харанхуй горим"}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">Ачаалж байна...</p>
        </div>
      </div>
    );
  }

  // Auth pages - no sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Not logged in - redirect handled by middleware, show nothing
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="h-full flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown on lg+ */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="relative">
          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-3 z-10 lg:hidden text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
          <Sidebar />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-end px-4 sm:px-6 gap-1">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 -ml-1 mr-auto text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] rounded-lg transition-colors"
          >
            <Menu size={22} />
          </button>
          <GlobalSearch />
          <DarkModeToggle />
          <UserMenu />
        </header>
        <main className="flex-1 overflow-y-auto bg-[var(--color-background)]">{children}</main>
      </div>
    </div>
  );
}
