

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
import { useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where, getDoc, doc } from "firebase/firestore";
import type { SosAlert } from "@/components/AppShell";
import type { UserProfile, UserGroup } from "@/types";


function DashboardContent({ alerts }: { alerts: SosAlert[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Alerta Activa</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts && alerts.length > 0 ? (
            <AlertCard alert={alerts[0]} />
          ) : (
            <p className="text-sm text-center text-muted-foreground">No hay alertas activas en tu red.</p>
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

  // Step 1: Get user profile to know their postal code
  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, "users", user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  // Step 2: Get user's groups
  const userGroupsQuery = useMemoFirebase(
    () => (user && firestore ? collection(firestore, `users/${user.uid}/groups`) : null),
    [user, firestore]
  );
  const { data: userGroups, isLoading: areGroupsLoading } = useCollection<UserGroup>(userGroupsQuery);

  // Step 3: Construct audience list and query
  const alertsQuery = useMemoFirebase(() => {
    // Wait until profile and groups are loaded to build the query
    if (!firestore || !userProfile || isProfileLoading || areGroupsLoading) return null;

    // Base audience is always family
    const audience: string[] = ['family'];

    // Add user's postal code if it exists
    if (userProfile.postalCode) {
      audience.push(userProfile.postalCode);
    }
    
    // Add all group IDs
    if (userGroups) {
      userGroups.forEach(group => audience.push(group.id));
    }
    
    // Firestore 'in' queries are limited to 30 elements.
    // If the user is in more than ~28 groups, this will fail.
    // This is a reasonable limitation for this app.
    if (audience.length === 0) {
      // If there's no audience, we can't query, but we know there are no alerts.
      // We can return a query that will always be empty, but it's better to just not query.
      return null;
    }

    // Step 4: Query the global alerts collection for any active alerts
    // where the audience list contains any of the user's relevant groups.
    return query(
      collection(firestore, "sos-alerts"),
      where("status", "==", "active"),
      where("audience", "array-contains-any", audience.slice(0, 30)),
      orderBy("timestamp", "desc"),
      limit(1)
    );
  }, [firestore, userProfile, userGroups, isProfileLoading, areGroupsLoading]);
  
  const { data: alerts, isLoading: areAlertsLoading } = useCollection<SosAlert>(alertsQuery);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    } else if (!isUserLoading && user && firestore && !isProfileLoading) {
        // Redirect to welcome if profile is loaded but postalCode is missing
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
  
  // Unified loading state
  const isLoading = isUserLoading || isProfileLoading || areGroupsLoading || (alertsQuery !== null && areAlertsLoading);


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
