
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { MessageSquare, Users, ChevronRight, MessagesSquare as MessagesSquareIcon } from "lucide-react";


export default function ChatSelectionPage() {
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
       <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Canales de Chat</CardTitle>
                <CardDescription>Selecciona un canal para empezar a comunicarte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Link href="/neighborhood-chat" passHref>
                    <Button variant="outline" className="w-full justify-between h-20 p-4">
                        <div className="flex items-center gap-4">
                             <div className="bg-secondary p-3 rounded-lg">
                                <MessageSquare className="h-6 w-6 text-secondary-foreground" />
                            </div>
                            <div>
                                <p className="text-base font-semibold">Chat Vecinal</p>
                                <p className="text-sm text-muted-foreground">Habla con tu grupo de vigilancia.</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </Link>
                 <Link href="/group-chat" passHref>
                    <Button variant="outline" className="w-full justify-between h-20 p-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-secondary p-3 rounded-lg">
                                <MessagesSquareIcon className="h-6 w-6 text-secondary-foreground" />
                            </div>
                            <div>
                                <p className="text-base font-semibold">Chat Grupal</p>
                                <p className="text-sm text-muted-foreground">Comunícate con tus grupos personalizados.</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    </AppShell>
  );
}
