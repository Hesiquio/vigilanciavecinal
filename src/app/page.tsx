
"use client";

import { useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, limit } from "firebase/firestore";
import type { UserProfile, UserGroup } from "@/types";
import { AlertCard } from "@/components/dashboard/AlertCard";
import type { SosAlert } from "@/components/AppShell";
import { AlertCircle, Loader } from "lucide-react";


function DashboardContent() {
    const { user, firestore, isUserLoading } = useFirebase();

    const userDocRef = useMemoFirebase(
        () => (user && firestore ? doc(firestore, "users", user.uid) : null),
        [user, firestore]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const alertsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'alert-feed'),
            limit(1)
        );
    }, [user, firestore]);

    const { data: alerts, isLoading: isLoadingAlerts } = useCollection<SosAlert>(alertsQuery);

    const isLoading = isUserLoading || isProfileLoading || isLoadingAlerts;
    
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                 <h3 className="text-xl font-headline font-bold text-destructive">Alerta Activa</h3>
                 <p className="text-sm text-muted-foreground">La alerta más reciente en tu red. Responde si puedes ayudar.</p>
            </div>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg h-64">
                    <Loader className="h-6 w-6 animate-spin"/>
                    <p className="mt-2">Cargando alertas...</p>
                </div>
            ) : alerts && alerts.length > 0 ? (
                <AlertCard alert={alerts[0]} />
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg h-64">
                    <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground"/>
                    <p className="mt-2 font-semibold">No hay alertas activas en tu red.</p>
                    <p className="mt-1">Cuando se envíe una, aparecerá aquí. Utiliza el botón de SOS para reportar una incidencia.</p>
                </div>
            )}
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

  const isLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    // Wait until loading is complete before doing any checks
    if (isLoading) {
      return;
    }

    // If loading is done and there's no user, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // If loading is done and there IS a user, check for postal code
    // A profile that doesn't exist in firestore will result in `userProfile` being `null` after loading.
    if (userProfile === null || !userProfile.postalCode) {
      router.push("/welcome");
    }
  }, [user, userProfile, isLoading, router]);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/login");
    }
  };
  

  if (isLoading || !user) {
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
        <DashboardContent />
    </AppShell>
  );
}
