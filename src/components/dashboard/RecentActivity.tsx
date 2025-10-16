"use client";

import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ShieldAlert, MessagesSquare, Loader, Megaphone } from "lucide-react";
import type { SosAlert } from "../AppShell";
import type { Aviso } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Combine types for the activity feed
type ActivityItem = (SosAlert & { type: 'alert' }) | (Aviso & { type: 'aviso' });

const formatTimestamp = (timestamp: { seconds: number, nanoseconds: number }): string => {
  if (!timestamp) return 'Ahora mismo';
  const date = new Date(timestamp.seconds * 1000);
  return `hace ${formatDistanceToNow(date, { locale: es })}`;
}


export function RecentActivity() {
  const { firestore } = useFirebase();

  // Query for the latest SOS alert
  const alertsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, "sos-alerts"), orderBy("timestamp", "desc"), limit(5)) : null,
    [firestore]
  );
  const { data: alerts, isLoading: isLoadingAlerts } = useCollection<SosAlert>(alertsQuery);

  // Query for the latest Aviso
  const avisosQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, "avisos"), orderBy("timestamp", "desc"), limit(5)) : null,
    [firestore]
  );
  const { data: avisos, isLoading: isLoadingAvisos } = useCollection<Aviso>(avisosQuery);

  const combinedActivity: ActivityItem[] = useMemoFirebase(() => {
    const typedAlerts: ActivityItem[] = alerts ? alerts.map(a => ({ ...a, type: 'alert' })) : [];
    const typedAvisos: ActivityItem[] = avisos ? avisos.map(a => ({ ...a, type: 'aviso' })) : [];

    return [...typedAlerts, ...typedAvisos]
      .filter(item => item.timestamp) // Ensure timestamp is not null
      .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
      .slice(0, 5); // Take the most recent 5 items overall
  }, [alerts, avisos]);

  const isLoading = isLoadingAlerts || isLoadingAvisos;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimos avisos y alertas en tus grupos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-6 text-sm text-muted-foreground">
              <Loader className="h-6 w-6 animate-spin"/>
              <p className="mt-2">Cargando actividad...</p>
          </div>
        ) : combinedActivity && combinedActivity.length > 0 ? (
          combinedActivity.map((item) => (
            <div key={item.id} className="flex items-start gap-4 rounded-lg bg-secondary/50 p-3">
              <div className={`rounded-full p-2 ${item.type === 'alert' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                {item.type === 'alert' ? <ShieldAlert className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.type === 'alert' ? item.category : item.title}</p>
                <p className="text-xs text-muted-foreground">{item.type === 'alert' ? item.message : item.description}</p>
                 <p className="text-xs text-muted-foreground mt-1">{formatTimestamp(item.timestamp)} por {item.userName}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg">
            <MessagesSquare className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No hay actividad reciente.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
