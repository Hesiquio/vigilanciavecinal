
"use client";

import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc, setDoc } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Bell, Loader, ShieldAlert, Megaphone, Check, History } from "lucide-react";
import type { SosAlert } from "./AppShell";
import type { Aviso, UserNotification } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type ActivityItem = (SosAlert & { type: 'alert' }) | (Aviso & { type: 'aviso' });

const formatTimestamp = (timestamp: { seconds: number, nanoseconds: number }): string => {
  if (!timestamp) return 'Ahora mismo';
  const date = new Date(timestamp.seconds * 1000);
  return `hace ${formatDistanceToNow(date, { locale: es })}`;
}


export function NotificationsDropdown() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [showPast, setShowPast] = useState(false);

  const alertsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(
          collection(firestore, "sos-alerts"),
          orderBy("timestamp", "desc"),
          limit(10) // Fetch a bit more to have some history
      );
  }, [firestore]);
  const { data: alerts, isLoading: isLoadingAlerts } = useCollection<SosAlert>(alertsQuery);
  
  const avisosQuery = useMemoFirebase(() => {
     if (!firestore) return null;
      return query(
          collection(firestore, "avisos"),
          orderBy("timestamp", "desc"),
          limit(10) // Fetch a bit more to have some history
      );
  },[firestore]);
  const { data: avisos, isLoading: isLoadingAvisos } = useCollection<Aviso>(avisosQuery);

  const readNotificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/readNotifications`);
  }, [firestore, user]);
  const { data: readNotifications } = useCollection<UserNotification>(readNotificationsQuery);

  const readNotificationIds = useMemo(() => new Set(readNotifications?.map(n => n.id)), [readNotifications]);


  const combinedActivity: ActivityItem[] = useMemo(() => {
    const typedAlerts: ActivityItem[] = alerts ? alerts.map(a => ({ ...a, type: 'alert' as const })) : [];
    const typedAvisos: ActivityItem[] = avisos ? avisos.map(a => ({ ...a, type: 'aviso' as const })) : [];

    const allActivity = [...typedAlerts, ...typedAvisos]
      .filter(item => item.timestamp)
      .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
      
    if (showPast) {
        return allActivity.slice(0, 10);
    }
    
    return allActivity.filter(item => !readNotificationIds.has(item.id)).slice(0, 5);
  }, [alerts, avisos, readNotificationIds, showPast]);

  const unreadCount = useMemo(() => {
      const allActivity = [...(alerts || []), ...(avisos || [])];
      return allActivity.filter(item => !readNotificationIds.has(item.id)).length;
  }, [alerts, avisos, readNotificationIds]);

  const isLoading = isLoadingAlerts || isLoadingAvisos;

  const handleMarkAsRead = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // Prevent the dropdown from closing
    if (!firestore || !user) {
        toast({ title: "Error", description: "Debes iniciar sesión para hacer esto.", variant: "destructive" });
        return;
    }
    const notifRef = doc(firestore, `users/${user.uid}/readNotifications`, itemId);
    try {
        await setDoc(notifRef, { isRead: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        toast({ title: "Error", description: "No se pudo marcar la notificación como leída.", variant: "destructive" });
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin mr-2"/>
            <span>Cargando...</span>
        </div>
      );
    }

    if (combinedActivity.length === 0) {
      return (
        <p className="p-4 text-center text-sm text-muted-foreground">
            {showPast ? "No hay notificaciones recientes." : "No hay notificaciones nuevas."}
        </p>
      );
    }

    return combinedActivity.map((item) => {
        const isRead = readNotificationIds.has(item.id);
        return (
          <DropdownMenuItem key={item.id} className="flex items-start gap-3" onSelect={(e) => e.preventDefault()}>
            <div className={`mt-1 rounded-full p-1.5 ${item.type === 'alert' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              {item.type === 'alert' ? <ShieldAlert className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.type === 'alert' ? item.category : item.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.type === 'alert' ? item.message : item.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatTimestamp(item.timestamp)}</p>
            </div>
            {!isRead && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={(e) => handleMarkAsRead(e, item.id)}
                    title="Marcar como leído"
                >
                    <Check className="h-4 w-4" />
                </Button>
            )}
          </DropdownMenuItem>
        )
    });
  }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
                <Bell className="h-6 w-6 text-muted-foreground" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span></span>}
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 md:w-96">
            <DropdownMenuLabel>Notificaciones Recientes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {renderContent()}
            </div>
             <DropdownMenuSeparator />
             <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowPast(!showPast); }}>
                <History className="mr-2 h-4 w-4" />
                <span>{showPast ? "Ocultar notificaciones pasadas" : "Ver notificaciones pasadas"}</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
