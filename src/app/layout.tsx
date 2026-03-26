import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/frontend/components/Sidebar";

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
    <html lang="mn" className="h-full">
      <body className="h-full flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
