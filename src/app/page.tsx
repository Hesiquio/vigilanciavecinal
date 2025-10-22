
"use client";

import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { collection, query, orderBy, where, Timestamp } from "firebase/firestore";
import type { SosAlert } from "@/components/AppShell";
import type { Aviso } from "@/types";
import { Loader, ShieldAlert, Megaphone, Calendar as CalendarIcon, Inbox } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ActivityItem = (SosAlert & { type: 'alert' }) | (Aviso & { type: 'aviso' });

const formatTimestamp = (timestamp: { seconds: number, nanoseconds: number }): string => {
  if (!timestamp) return 'Ahora mismo';
  const date = new Date(timestamp.seconds * 1000);
  return format(date, "PPPp", { locale: es });
}


export default function Home() {
  const { user, isUserLoading, auth, firestore } = useFirebase();
  const router = useRouter();
  const [selectedAlert, setSelectedAlert] = useState<SosAlert | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Define start and end of the selected day
  const startOfDay = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(start);
  }, [selectedDate]);

  const endOfDay = useMemo(() => {
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    return Timestamp.fromDate(end);
  }, [selectedDate]);


  // Queries filtered by the selected date range
  const alertsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(
          collection(firestore, "sos-alerts"),
          where("timestamp", ">=", startOfDay),
          where("timestamp", "<=", endOfDay),
          orderBy("timestamp", "desc")
      );
  }, [firestore, startOfDay, endOfDay]);
  const { data: alerts, isLoading: isLoadingAlerts, error: alertsError } = useCollection<SosAlert>(alertsQuery);
  
  const avisosQuery = useMemoFirebase(() => {
     if (!firestore) return null;
      return query(
          collection(firestore, "avisos"),
          where("timestamp", ">=", startOfDay),
          where("timestamp", "<=", endOfDay),
          orderBy("timestamp", "desc")
      );
  },[firestore, startOfDay, endOfDay]);
  const { data: avisos, isLoading: isLoadingAvisos, error: avisosError } = useCollection<Aviso>(avisosQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/login");
    }
  };
  
  const combinedActivity: ActivityItem[] = useMemo(() => {
    const typedAlerts: ActivityItem[] = alerts ? alerts.map(a => ({ ...a, type: 'alert' as const })) : [];
    const typedAvisos: ActivityItem[] = avisos ? avisos.map(a => ({ ...a, type: 'aviso' as const })) : [];

    return [...typedAlerts, ...typedAvisos]
      .filter(item => item.timestamp)
      .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
  }, [alerts, avisos]);

  const isLoading = isLoadingAlerts || isLoadingAvisos;
  const hasError = alertsError || avisosError;

  const handleAlertClick = (item: ActivityItem) => {
    if (item.type === 'alert') {
        setSelectedAlert(item);
    }
  }


  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-sm text-muted-foreground">
            <Loader className="h-6 w-6 animate-spin"/>
            <p className="mt-2">Cargando actividad...</p>
        </div>
      );
    }

    if (hasError) {
      return (
         <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-destructive/50 rounded-lg text-destructive p-4">
            <ShieldAlert className="h-8 w-8" />
            <p className="mt-2 text-sm font-semibold text-center">Error al cargar la actividad</p>
            <p className="text-xs max-w-full truncate text-center">{hasError.message}</p>
          </div>
      );
    }

    if (combinedActivity.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-center p-4">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No hay actividad para la fecha seleccionada.</p>
          </div>
      );
    }

    return combinedActivity.map((item) => (
      <Card 
          key={item.id} 
          onClick={() => handleAlertClick(item)}
          className={cn("w-full text-left transition-colors", item.type === 'alert' && "cursor-pointer hover:bg-secondary/50")}
      >
        <CardHeader className="flex-row items-start gap-4 space-y-0">
             <div className={`shrink-0 rounded-full p-2 ${item.type === 'alert' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                {item.type === 'alert' ? <ShieldAlert className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
            </div>
            <div className="flex-1">
                <CardTitle className="text-base">{item.type === 'alert' ? item.category : item.title}</CardTitle>
                <CardDescription className="text-xs">{formatTimestamp(item.timestamp)} por {item.userName}</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">{item.type === 'alert' ? item.message : item.description}</p>
        </CardContent>
      </Card>
    ));
  }


  return (
    <AppShell user={user} onSignOut={handleSignOut}>
       <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-headline font-bold text-foreground">
                        Registro de Actividad
                    </h2>
                    <p className="text-muted-foreground">Consulta las alertas y avisos por fecha.</p>
                </div>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full sm:w-[280px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-4">
                {renderContent()}
            </div>
        </div>
         <Dialog open={!!selectedAlert} onOpenChange={(isOpen) => !isOpen && setSelectedAlert(null)}>
            <DialogContent className="max-w-lg w-full">
                <DialogHeader>
                    <DialogTitle>Detalle de la Alerta</DialogTitle>
                </DialogHeader>
                {selectedAlert && <AlertCard alert={selectedAlert} />}
            </DialogContent>
        </Dialog>
    </AppShell>
  );
}

