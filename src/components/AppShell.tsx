

"use client";

import type { ReactNode } from "react";
import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SosModal } from "./SosModal";
import { AvisoModal } from "./AvisoModal";
import { Bell, LogOut, User as UserIcon, Home, MessageSquare, Users, Shield, Heart, Megaphone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "firebase/auth";
import { BottomNavBar } from "./BottomNavBar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";


export type AlertCategory = "Robo" | "Accidentes" | "Desastres Naturales" | "Personas Sospechosas";
export type AlertStatus = "active" | "resolved" | "expired";

export interface SosAlert {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
  location: string;
  message: string;
  category: AlertCategory;
  status: AlertStatus;
}

const navItems = [
  { href: "/", label: "Principal", icon: Home },
  { href: "/neighborhood", label: "Vecinal", icon: Shield },
  { href: "/groups", label: "Grupos", icon: Users },
  { href: "/family", label: "Familia", icon: Heart },
];

export function AppShell({ user, onSignOut, children }: { user: User, onSignOut: () => void, children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm md:px-6">
        <div className="flex items-center gap-4">
           <Link href="/" className="flex items-center gap-2">
             <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h1 className="font-headline text-lg font-bold text-foreground truncate"><span className="hidden sm:inline">Vigilancia Vecinal</span></h1>
           </Link>
        </div>

        <nav className="hidden items-center gap-2 md:flex ml-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button key={item.href} asChild variant="ghost" className={cn(isActive && "bg-secondary")}>
                 <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 ml-auto">
          {user && <AvisoModal user={user} />}
          <Bell className="h-6 w-6 text-muted-foreground" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Avatar className="h-8 w-8 cursor-pointer">
                {user && <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />}
                <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                <Link href="/settings">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Ir al Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6">
         {children}
      </main>

      {user && <SosModal user={user} />}
      <BottomNavBar />
    </div>
  );
}
