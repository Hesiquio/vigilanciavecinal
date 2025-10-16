
"use client";

import { useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where, doc } from "firebase/firestore";
import type { SosAlert } from "@/components/AppShell";
import type { UserProfile } from "@/types";


const placeholderAlert: SosAlert = {
    id: "placeholder-1",
    userId: "system-user",
    userName: "Carlos Rodriguez",
    userAvatarUrl: "https://picsum.photos/seed/2/100/100",
    timestamp: {
        seconds: Math.floor(Date.now() / 1000) - 600, // 10 minutes ago
        nanoseconds: 0
    },
    location: "Lat: 19.4326, Lon: -99.1332",
    message: "Se reporta actividad sospechosa en la Calle Falsa 123. Un individuo con sudadera oscura merodeando los coches.",
    category: "Personas Sospechosas",
    status: "active",
    audience: [],
};


function DashboardContent({ alerts }: { alerts: SosAlert[] }) {
  const displayAlerts = alerts && alerts.length > 0 ? alerts : [placeholderAlert];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Alerta Activa</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertCard alert={displayAlerts[0]} />
        </CardContent>
      </Card>
      <RecentActivity />
    </div>
  );
}


export default function Home() {
  const { user, isUserLoading, auth, firestore } = useFirebase();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, "users", user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  // Corrected Query: Point to the user's specific alert-feed subcollection.
  const alertsQuery = useMemoFirebase(() => {
    if (!firestore || !user) {
      return null;
    }
    // This query now safely points to a subcollection the user is allowed to read.
    return query(
      collection(firestore, "users", user.uid, "alert-feed"),
      where("status", "==", "active"),
      orderBy("timestamp", "desc"),
      limit(1)
    );
  }, [firestore, user]);
  
  const { data: alerts, isLoading: areAlertsLoading } = useCollection<SosAlert>(alertsQuery);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    } else if (!isUserLoading && user && firestore && !isProfileLoading) {
        if (!userProfile?.postalCode) {
            router.push("/welcome");
        }
    }
  }, [user, isUserLoading, router, firestore, userProfile, isProfileLoading]);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/login");
    }
  };
  
  const isLoading = isUserLoading || isProfileLoading || (alertsQuery !== null && areAlertsLoading);


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
