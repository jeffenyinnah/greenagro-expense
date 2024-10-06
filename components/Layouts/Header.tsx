"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      toast({
        title: "Success",
        description: "You have been logged out.",
        variant: "default",
        className: "bg-green-500 text-white",
      });
      router.push("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-green-600 text-white h-16 flex items-center justify-between px-4 md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex items-center justify-center flex-grow md:flex-grow-0">
        <div className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
          <Image
            src="/logo.png"
            alt="Expense Management Logo"
            width={48}
            height={48}
            className="object-cover"
          />
        </div>
        <span className="hidden md:inline-block font-semibold text-lg ml-2">
          Expense Management
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-green-100"
        >
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-green-700"
            >
              <span className="hidden md:inline-block">
                {session?.user?.email}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem onSelect={() => router.push("/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem> */}
            <DropdownMenuItem onSelect={handleSignOut}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
