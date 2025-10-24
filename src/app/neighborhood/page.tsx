
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFirebase, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import type { UserProfile, ChatMessage } from "@/types";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { cn } from "@/lib/utils";

const NeighborhoodChat = ({ user, userProfile, firestore }: { user: any, userProfile: UserProfile | null, firestore: any }) => {
    const postalCode = userProfile?.postalCode;
    const messagesRef = useMemoFirebase(
        () => (firestore && postalCode) ? query(collection(firestore, `neighborhood-chats/${postalCode}/messages`), orderBy("timestamp", "asc")) : null,
        [firestore, postalCode]
    );
    const { data: messages, isLoading } = useCollection<ChatMessage>(messagesRef);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !firestore || !postalCode) return;

        const messageData = {
            text: newMessage,
            userId: user.uid,
            userName: user.displayName || "Unknown User",
            userAvatarUrl: user.photoURL || "",
            timestamp: serverTimestamp(),
        };
        await addDoc(collection(firestore, `neighborhood-chats/${postalCode}/messages`), messageData);
        setNewMessage("");
    };
    
    const chatTitle = `Chat Vecinal: ${postalCode || '...'}`;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{chatTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="space-y-4 p-4 overflow-y-auto max-h-[400px]">
                    {isLoading && <p className="text-center">Cargando mensajes...</p>}
                    {!isLoading && messages?.map((msg) => (
                       <div key={msg.id} className={cn("flex items-start gap-2", msg.userId === user.uid ? "justify-end" : "justify-start")}>
                           {msg.userId !== 'system' && msg.userId !== user.uid && <Avatar className="h-8 w-8"><AvatarImage src={msg.userAvatarUrl} /><AvatarFallback>{msg.userName?.charAt(0)}</AvatarFallback></Avatar>}
                           <div className={cn("flex flex-col gap-1", msg.userId === user.uid ? "items-end" : "items-start")}>
                           {msg.userId === 'system' ? (
                               <div className="w-full text-center text-xs text-muted-foreground italic my-2">
                                   <p>{msg.text.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
                               </div>
                           ) : (
                               <>
                                    {msg.userId !== user.uid && <p className="text-xs text-muted-foreground px-2">{msg.userName}</p>}
                                    <div className={cn("max-w-xs rounded-lg p-3", msg.userId === user.uid ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                               </>
                           )}
                           </div>
                           {msg.userId !== 'system' && msg.userId === user.uid && <Avatar className="h-8 w-8"><AvatarImage src={user.photoURL || undefined} /><AvatarFallback>TÚ</AvatarFallback></Avatar>}
                       </div>
                    ))}
                     <div ref={messagesEndRef} />
                </div>
            </CardContent>
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t p-4">
                <Input placeholder="Escribe un mensaje..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                <Button type="submit"><Send /></Button>
            </form>
        </Card>
    );
};

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

  if (isLoading || !user || !firestore) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <AppShell user={user} onSignOut={handleSignOut}>
       <div className="grid gap-6 lg:grid-cols-2">
            <NeighborhoodChat user={user} userProfile={userProfile} firestore={firestore} />
            <div className="space-y-6">
                <RecentActivity />
            </div>
       </div>
    </AppShell>
  );
}
