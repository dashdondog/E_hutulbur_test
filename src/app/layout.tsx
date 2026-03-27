import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/frontend/lib/auth-context";
import { ThemeProvider } from "@/frontend/lib/theme-context";
import AppShell from "@/frontend/components/AppShell";

export const metadata: Metadata = {
  title: "11-р ангийн хичээлийн систем",
  description: "Хөтөлбөр бэлдэх & Тест бэлтгэх систем",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="h-full">
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
