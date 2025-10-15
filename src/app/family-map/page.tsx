
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/firebase";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Map } from "lucide-react";

export default function FamilyMapPage() {
  const { user, isUserLoading, auth } = useFirebase();
  const router = useRouter();

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
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <AppShell user={user} onSignOut={handleSignOut}>
      <div className="flex h-full flex-col items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
             <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Map className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">Mapa Familiar</CardTitle>
            <CardDescription>
              Esta funcionalidad está en construcción.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Próximamente podrás ver la ubicación de tus seres queridos en un mapa privado.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
