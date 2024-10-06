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
import Image from "next/image";

const menuItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  {
    href: "/expenses",
    icon: DollarSign,
    label: "Expenses",
    subItems: [
      { href: "/expenses/users", icon: Users, label: "Users" },
      {
        href: "/expenses/expense-categories",
        icon: FileText,
        label: "Expense Categories",
      },
      {
        href: "/expenses/expense-types",
        icon: FileText,
        label: "Expense Types",
      },
    ],
  },
  { href: "/reports", icon: BarChart2, label: "Reports" },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const SidebarContent = ({ isMobile = false }) => (
    <ScrollArea className="h-full px-3 py-2 bg-white">
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <div key={item.href} className="py-1">
            <Link
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-[#17a34a] text-white"
                  : "text-gray-700 hover:bg-green-50 hover:text-green-900"
              )}
              onClick={() => isMobile && setIsOpen(false)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span>{item.label}</span>
            </Link>
            {item.subItems && (
              <div className="ml-6 mt-1 space-y-1">
                {item.subItems.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === subItem.href
                        ? "bg-[#17a34a] text-white"
                        : "text-gray-600 hover:bg-green-50 hover:text-green-900"
                    )}
                    onClick={() => isMobile && setIsOpen(false)}
                  >
                    <subItem.icon className="mr-3 h-4 w-4" />
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
            <Image
              src="/logo.png"
              alt="Expense Manager Logo"
              width={56}
              height={56}
            />
          </div>
          <h2 className="text-xl font-bold text-white">Expense Manager</h2>
          <p className="text-sm text-green-50 mt-1">Manage your finances</p>
        </div>
        <SidebarContent />
      </aside>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          <SheetHeader className="px-4 pb-3 border-b bg-[#17a34a] flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="Expense Manager Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <SheetTitle className="text-white ml-2">Expense Manager</SheetTitle>
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
