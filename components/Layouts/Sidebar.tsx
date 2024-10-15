"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  DollarSign,
  Users,
  FileText,
  BarChart2,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

const menuItems = [
  { href: "/dashboard", icon: Home, label: "Painel de controlo" },
  {
    href: "/expenses",
    icon: DollarSign,
    label: "Despesas",
    subItems: [
      { href: "/expenses/users", icon: Users, label: "Usuários" },
      {
        href: "/expenses/expense-categories",
        icon: FileText,
        label: "Categorias de despesas",
      },
      {
        href: "/expenses/expense-types",
        icon: FileText,
        label: "Tipos de despesas",
      },
    ],
  },
  { href: "/reports", icon: BarChart2, label: "  Relatórios" },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const SidebarContent = ({ isMobile = false }) => (
    <ScrollArea className="h-full px-3 py-4 bg-white">
      <nav className="space-y-3">
        {menuItems.map((item) => (
          <div key={item.href} className="py-2">
            <Link
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors",
                pathname === item.href
                  ? "bg-[#17a34a] text-white"
                  : "text-gray-700 hover:bg-green-50 hover:text-green-900"
              )}
              onClick={() => isMobile && setIsOpen(false)}
            >
              <item.icon className="mr-4 h-6 w-6" />
              <span>{item.label}</span>
            </Link>
            {item.subItems && (
              <div className="ml-8 mt-2 space-y-2">
                {item.subItems.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      pathname === subItem.href
                        ? "bg-[#17a34a] text-white"
                        : "text-gray-600 hover:bg-green-50 hover:text-green-900"
                    )}
                    onClick={() => isMobile && setIsOpen(false)}
                  >
                    <subItem.icon className="mr-3 h-5 w-5" />
                    <span>{subItem.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </ScrollArea>
  );

  return (
    <>
      <aside className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r md:h-screen">
        <div className="flex flex-col items-center justify-center p-6 bg-[#17a34a]">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Gestor de Despesas</h2>
          <p className="text-sm text-green-50 mt-1">Gerir as finanças</p>
        </div>
        <SidebarContent />
      </aside>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          <SheetHeader className="px-4 pb-3 border-b bg-[#17a34a] flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <SheetTitle className="text-white ml-2">
              Gestor de Despesas
            </SheetTitle>
          </SheetHeader>
          <SidebarContent isMobile={true} />
          <SheetClose className="absolute top-4 right-4">
            <X className="h-5 w-5 text-red-500" />
          </SheetClose>
        </SheetContent>
      </Sheet>
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-40 gap-2 text-black bg-white md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>
    </>
  );
}

export default Sidebar;
