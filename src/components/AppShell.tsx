"use client";

import type { ReactNode } from "react";
import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { users, type SosAlert, type User } from "@/lib/data";
import { SosModal } from "./SosModal";
import { Bell, Settings } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";


function DashboardContent({ alerts = [], currentUser }: { alerts: SosAlert[], currentUser: User | null }) {
  if (!currentUser) {
    return null; // Or a loading state
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-headline font-bold text-foreground">
          Hola, {currentUser.name}
        </h2>
        <p className="text-muted-foreground">Bienvenido a tu red de seguridad vecinal.</p>
      </div>

      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">Alerta Activa</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          ) : (
            <p className="text-sm text-center text-destructive/80">No hay alertas activas en este momento.</p>
          )}
        </CardContent>
      </Card>

      <RecentActivity />
      
    </div>
  );
}


export function AppShell() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const storedAlerts = localStorage.getItem("sosAlerts");
      if (storedAlerts) {
        setAlerts(JSON.parse(storedAlerts));
      }

      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        // If no user is stored, default to the first one
        setCurrentUser(users[0]);
        localStorage.setItem("currentUser", JSON.stringify(users[0]));
      }

    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      // Fallback to default if parsing fails
      if (!currentUser) setCurrentUser(users[0]);
    }
  }, []);

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("sosAlerts", JSON.stringify(alerts));
    } catch (error) {
      console.error("Failed to save alerts to localStorage", error);
    }
  }, [alerts]);

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
     try {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } catch (error) {
      console.error("Failed to save user to localStorage", error);
    }
  };


  const handleAddAlert = (message: string, location: string) => {
    if (!currentUser) return;
    const newAlert: SosAlert = {
      id: `sos${Date.now()}`,
      user: currentUser,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      location: location,
      message: message,
      type: 'text',
    };
    setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
  };
  

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Avatar className="h-8 w-8 cursor-pointer">
                {currentUser && <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />}
                <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Cambiar de Usuario</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {users.map(user => (
                <DropdownMenuItem key={user.id} onClick={() => handleSetCurrentUser(user)}>
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6">
         <DashboardContent alerts={alerts} currentUser={currentUser} />
      </main>

      <SosModal onSendSos={handleAddAlert} />
    </div>
  );
}
