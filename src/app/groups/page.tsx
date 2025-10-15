
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
import { Button } from "@/components/ui/button";
import { PlusCircle, Users } from "lucide-react";


export default function GroupsPage() {
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
       <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Mis Grupos</CardTitle>
                <CardDescription>Crea o únete a grupos de chat personalizados.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">Aún no perteneces a ningún grupo.</p>
                </div>
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear un Nuevo Grupo
                </Button>
                 <p className="text-xs text-muted-foreground pt-4">La funcionalidad de grupos está en construcción.</p>
            </CardContent>
        </Card>
    </AppShell>
  );
}
