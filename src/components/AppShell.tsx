"use client";

import type { ReactNode } from "react";
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { currentUser, type SosAlert, users } from "@/lib/data";
import { SosModal } from "./SosModal";
import { Bell, Settings } from "lucide-react";
import Link from "next/link";
import DashboardPage from "@/app/page";

export function AppShell({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);

  const handleAddAlert = (message: string, location: string) => {
    const newAlert: SosAlert = {
      id: `sos${Date.now()}`,
      user: currentUser, // Usamos el usuario actual para la nueva alerta
      timestamp: "Hace un momento",
      location: location,
      message: message,
      type: 'text',
    };
    setAlerts([newAlert, ...alerts]);
  };
  
  // Clonamos el children y le pasamos los props que necesita
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === DashboardPage) {
      // @ts-ignore
      return React.cloneElement(child, { alerts });
    }
    return child;
  });


  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm md:px-6">
        <div className="flex items-center gap-2">
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
          <h1 className="font-headline text-lg font-bold text-foreground">SISTEMA DE VIGILANCIA VECINAL</h1>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="h-6 w-6 text-muted-foreground" />
          <Link href="/settings">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </Link>
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6">
        {childrenWithProps}
      </main>

      <SosModal onSendSos={handleAddAlert} />
    </div>
  );
}
