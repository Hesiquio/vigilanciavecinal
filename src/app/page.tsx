
"use client";

import { useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import type { SosAlert } from "@/components/AppShell";


function DashboardContent({ alerts }: { alerts: SosAlert[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Alerta Activa</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts && alerts.length > 0 ? (
            alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          ) : (
            <p className="text-sm text-center text-muted-foreground">No hay alertas activas en este momento.</p>
          )}
        </CardContent>
      </Card>

      <RecentActivity />
    </div>
  );
}


export default function Home() {
  const { user, isUserLoading, auth, firestore } = useFirebase();
  const router = useRouter();

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

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }


  return (
    <AppShell user={user} onSignOut={handleSignOut}>
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
    </AppShell>
  );
}
