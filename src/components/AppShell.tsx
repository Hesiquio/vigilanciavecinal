"use client";

import type { ReactNode } from "react";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SosModal } from "./SosModal";
import { Bell, Settings, LogOut, Home, PanelLeft } from "lucide-react";
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
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import type { User } from "firebase/auth";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";

// This is the shape of the data in Firestore
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
}

function DashboardContent({ alerts }: { alerts: SosAlert[] }) {
  return (
    <div className="space-y-6">
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">Alerta Activa</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts && alerts.length > 0 ? (
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

export function AppShell({ user, onSignOut }: { user: User, onSignOut: () => void }) {
  const { firestore } = useFirebase();

  const alertsQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      return query(
        collection(firestore, "sos-alerts"),
        orderBy("timestamp", "desc"),
        limit(1)
      );
    },
    [firestore]
  );
  
  const { data: alerts, isLoading } = useCollection<SosAlert>(alertsQuery);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full flex-col bg-background">
        <Sidebar>
          <SidebarHeader>
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
              <h1 className="font-headline text-lg font-bold text-foreground truncate">Vigilancia Vecinal</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton href="/" asChild>
                  <Home />
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/settings" asChild>
                  <Settings />
                  Ajustes
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        
        <SidebarInset>
          <header className="flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-4 ml-auto">
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
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6">
             <div className="mb-6">
                <h2 className="text-2xl font-headline font-bold text-foreground">
                  Hola, {user.displayName || user.email}
                </h2>
                <p className="text-muted-foreground">Bienvenido a tu red de seguridad vecinal.</p>
              </div>
              {isLoading ? (
                 <div className="flex justify-center items-center h-48">
                  <p>Cargando alertas...</p>
                </div>
              ) : (
                 <DashboardContent alerts={alerts || []} />
              )}
          </main>

          <SosModal user={user} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
