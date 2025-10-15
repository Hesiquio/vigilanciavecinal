
"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send } from "lucide-react";


const ChatViewPlaceholder = ({ title }: { title: string }) => (
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


export default function ChatPage() {
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
       <Card className="h-full w-full max-w-4xl mx-auto">
            <Tabs defaultValue="neighborhood" className="h-full flex flex-col">
                <CardHeader>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="neighborhood">Chat Vecinal</TabsTrigger>
                        <TabsTrigger value="family">Chat Familiar</TabsTrigger>
                    </TabsList>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <TabsContent value="neighborhood" className="h-full m-0">
                        <ChatViewPlaceholder title="Chat Vecinal" />
                    </TabsContent>
                    <TabsContent value="family" className="h-full m-0">
                        <ChatViewPlaceholder title="Chat Familiar" />
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
    </AppShell>
  );
}

