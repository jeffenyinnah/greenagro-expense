import type { Metadata } from "next";
import "../globals.css";
import { Sidebar } from "@/components/Layouts/Sidebar";
import { Header } from "@/components/Layouts/Header";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Expense Manager",
  description: "Manage your expenses with ease",
};

export default function ExpenseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-green-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
          <Toaster />
        </main>
      </div>
    </div>
  );
}
