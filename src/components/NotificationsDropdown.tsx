
"use client";

import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc, deleteDoc } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Bell, Loader, ShieldAlert, Megaphone, X } from "lucide-react";
import type { SosAlert } from "./AppShell";
import type { Aviso } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

type ActivityItem = (SosAlert & { type: 'alert' }) | (Aviso & { type: 'aviso' });

const formatTimestamp = (timestamp: { seconds: number, nanoseconds: number }): string => {
  if (!timestamp) return 'Ahora mismo';
  const date = new Date(timestamp.seconds * 1000);
  return `hace ${formatDistanceToNow(date, { locale: es })}`;
}


export function NotificationsDropdown() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const alertsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(
          collection(firestore, "sos-alerts"),
          orderBy("timestamp", "desc"),
          limit(5)
      );
  }, [firestore]);
  const { data: alerts, isLoading: isLoadingAlerts } = useCollection<SosAlert>(alertsQuery);
  
  const avisosQuery = useMemoFirebase(() => {
     if (!firestore) return null;
      return query(
          collection(firestore, "avisos"),
          orderBy("timestamp", "desc"),
          limit(5)
      );
  },[firestore]);
  const { data: avisos, isLoading: isLoadingAvisos } = useCollection<Aviso>(avisosQuery);


  const combinedActivity: ActivityItem[] = useMemo(() => {
    const typedAlerts: ActivityItem[] = alerts ? alerts.map(a => ({ ...a, type: 'alert' as const })) : [];
    const typedAvisos: ActivityItem[] = avisos ? avisos.map(a => ({ ...a, type: 'aviso' as const })) : [];

    return [...typedAlerts, ...typedAvisos]
      .filter(item => item.timestamp)
      .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
      .slice(0, 5);
  }, [alerts, avisos]);

  const isLoading = isLoadingAlerts || isLoadingAvisos;

  const handleDeleteNotification = async (item: ActivityItem, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!firestore || isDeleting) return;
    setIsDeleting(item.id);

    const collectionName = item.type === 'alert' ? 'sos-alerts' : 'avisos';
    try {
        const docRef = doc(firestore, collectionName, item.id);
        await deleteDoc(docRef);
        toast({ title: "Notificación eliminada" });
    } catch (error) {
        console.error("Error deleting notification:", error);
        toast({ title: "Error", description: "No se pudo eliminar la notificación.", variant: "destructive" });
    } finally {
        setIsDeleting(null);
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
        <p className="p-4 text-center text-sm text-muted-foreground">No hay notificaciones.</p>
      );
    }

    return combinedActivity.map((item) => (
      <DropdownMenuItem key={item.id} className="flex items-start gap-3 relative pr-8">
        <div className={`mt-1 rounded-full p-1.5 ${item.type === 'alert' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {item.type === 'alert' ? <ShieldAlert className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{item.type === 'alert' ? item.category : item.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{item.type === 'alert' ? item.message : item.description}</p>
           <p className="text-xs text-muted-foreground mt-1">{formatTimestamp(item.timestamp)}</p>
        </div>
        <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-1 right-1 h-6 w-6"
            onClick={(e) => handleDeleteNotification(item, e)}
            disabled={isDeleting === item.id}
        >
            {isDeleting === item.id ? <Loader className="h-3 w-3 animate-spin"/> : <X className="h-3 w-3" />}
        </Button>
      </DropdownMenuItem>
    ));
  }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
                <Bell className="h-6 w-6 text-muted-foreground" />
                {combinedActivity.length > 0 && <span className="absolute top-1 right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span></span>}
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificaciones Recientes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-1">
              {renderContent()}
            </div>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
