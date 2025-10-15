
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/types";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { RecentActivity } from "@/components/dashboard/RecentActivity";


const NeighborhoodChatPlaceholder = ({ title }: { title: string }) => (
    <div className="flex h-full flex-col">
        <div className="flex-1 space-y-4 p-4 overflow-y-auto">
             <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src="https://picsum.photos/seed/1/100/100" />
                    <AvatarFallback>V</AvatarFallback>
                </Avatar>
                <div className="max-w-xs rounded-lg bg-secondary p-3">
                    <p className="text-sm">Hola a todos, ¿todo en orden por la colonia?</p>
                </div>
            </div>
             <div className="flex items-end gap-2 justify-end">
                <div className="max-w-xs rounded-lg bg-primary text-primary-foreground p-3">
                    <p className="text-sm">¡Hola! Sí, todo tranquilo por acá. Gracias por preguntar.</p>
                </div>
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>TÚ</AvatarFallback>
                </Avatar>
            </div>
             <p className="text-center text-xs text-muted-foreground py-4">Esta es una vista previa. La funcionalidad de chat está en construcción.</p>
        </div>
        <div className="flex items-center gap-2 border-t p-4">
            <Input placeholder="Escribe un mensaje..." disabled />
            <Button disabled><Send /></Button>
        </div>
    </div>
);


export default function NeighborhoodPage() {
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
    }
  }, [user, isUserLoading, router]);

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
        <p>Cargando...</p>
      </div>
    );
  }

  const chatTitle = `Chat Vecinal: ${userProfile?.postalCode || '...'}`;

  return (
    <AppShell user={user} onSignOut={handleSignOut}>
       <div className="grid gap-6 lg:grid-cols-2 h-full">
            <Card className="flex flex-col">
                 <CardHeader>
                    <CardTitle>{chatTitle}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <NeighborhoodChatPlaceholder title={chatTitle} />
                </CardContent>
            </Card>
            <div className="space-y-6">
                <RecentActivity />
            </div>
       </div>
    </AppShell>
  );
}

    