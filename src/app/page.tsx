
"use client";

import { useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/types";

export default function Home() {
  const { user, isUserLoading, auth, firestore } = useFirebase();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, "users", user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  // isLoading is true until both the user and their profile have finished loading.
  const isLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    // 1. If still loading, do nothing yet.
    if (isLoading) {
      return;
    }

    // 2. After loading, if there's no user, redirect to login.
    if (!user) {
      router.push("/login");
      return;
    }
    
    // 3. After loading, if there is a user but their profile is missing the postal code,
    // then and only then, redirect to the welcome page.
    // This prevents premature redirection before userProfile is loaded.
    if (userProfile === null || (userProfile && !userProfile.postalCode)) {
      router.push("/welcome");
    }

  }, [user, userProfile, isLoading, router]);


  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/login");
    }
  };
  
  // Display a loading screen while waiting for auth and profile data.
  // This also prevents a flash of the dashboard before a redirect can happen.
  if (isLoading || !userProfile || !userProfile.postalCode) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // If we reach here, the user is logged in and their profile is complete.
  return (
    <AppShell user={user} onSignOut={handleSignOut}>
       <div className="mb-6">
          <h2 className="text-2xl font-headline font-bold text-foreground">
            Hola, {user.displayName || user.email}
          </h2>
          <p className="text-muted-foreground">Bienvenido a tu red de seguridad vecinal.</p>
        </div>
        <RecentActivity />
    </AppShell>
  );
}
