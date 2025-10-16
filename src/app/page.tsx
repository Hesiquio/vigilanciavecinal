
"use client";

import { useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
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

  const isLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    // 1. Si aún está cargando, no hagas nada todavía.
    if (isLoading) {
      return;
    }

    // 2. Si la carga terminó y no hay usuario, redirige al login.
    if (!user) {
      router.push("/login");
      return;
    }
    
    // 3. Si la carga terminó, hay un usuario, pero su perfil no tiene código postal,
    // entonces y solo entonces, redirige a la página de bienvenida.
    // Esto previene la redirección prematura antes de que userProfile se cargue.
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
  
  if (isLoading || !user || !userProfile) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si llegamos aquí, el usuario está logueado y tiene un perfil completo.
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
