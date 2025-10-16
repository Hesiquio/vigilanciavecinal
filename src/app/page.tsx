
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


const placeholderAlert: SosAlert = {
    id: "placeholder",
    userId: "system",
    userName: "Sistema de Vigilancia",
    userAvatarUrl: "",
    message: "Aún no hay alertas activas en tu red. Cuando se envíe una, aparecerá aquí. Utiliza el botón de SOS para reportar una incidencia.",
    category: "Robo",
    location: "Tu Vecindario",
    timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
};

function DashboardContent() {
    const { user, firestore, isUserLoading } = useFirebase();

    const userDocRef = useMemoFirebase(
        () => (user && firestore ? doc(firestore, "users", user.uid) : null),
        [user, firestore]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const userGroupsQuery = useMemoFirebase(
        () => (user && firestore ? collection(firestore, `users/${user.uid}/groups`) : null),
        [user, firestore]
    );
    const { data: userGroups, isLoading: isLoadingGroups } = useCollection<UserGroup>(userGroupsQuery);
    
    const audience = useMemo(() => {
        const aud: string[] = [];
        if (userProfile?.postalCode) {
            aud.push(userProfile.postalCode);
        }
        if (userGroups && userGroups.length > 0) {
            aud.push(...userGroups.map(g => g.id));
        }
        // Add a general audience for family alerts
        aud.push('family');
        return aud;
    }, [userProfile, userGroups]);


    const alertsQuery = useMemoFirebase(() => {
        if (!firestore || audience.length === 0) return null;
        return query(
            collection(firestore, "sos-alerts"),
            where('audience', 'array-contains-any', audience),
            limit(1)
        );
    }, [firestore, audience]);

    const { data: alerts, isLoading: isLoadingAlerts } = useCollection<SosAlert>(alertsQuery);

    const isLoading = isUserLoading || isProfileLoading || isLoadingGroups || isLoadingAlerts;
    
    const activeAlert = alerts && alerts.length > 0 ? alerts[0] : placeholderAlert;

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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    } else if (!isUserLoading && user && !isProfileLoading) {
      // Only check for postalCode if userProfile is loaded (is not undefined)
      // A profile that doesn't exist in firestore will result in `null` after loading.
      if (userProfile === null || (userProfile && !userProfile.postalCode)) {
        router.push("/welcome");
      }
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/login");
    }
  };
  
  const isLoading = isUserLoading || isProfileLoading;

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
