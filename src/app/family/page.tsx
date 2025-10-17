
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs, writeBatch, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { doc } from "firebase/firestore";
import type { FamilyMember, UserProfile, ChatMessage } from "@/types";
import { Loader, UserPlus, Check, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertCard } from "@/components/dashboard/AlertCard";
import type { SosAlert } from "@/components/AppShell";
import dynamic from 'next/dynamic';

const LeafletMapComponent = dynamic(() => import('@/components/dashboard/LeafletMapComponent'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center"><p>Cargando mapa...</p></div>,
});


const parseLocation = (locationStr: string): { lat: number; lng: number } | null => {
    if (!locationStr) return null;
    const match = locationStr.match(/Lat: ([-]?\d+\.\d+), Lon: ([-]?\d+\.\d+)/);
    if (match && match.length === 3) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
        }
    }
    return null;
}

async function findUserByEmail(db: any, email: string): Promise<(UserProfile & {id: string}) | null> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() as UserProfile };
}

async function sendFamilyRequest(db: any, currentUser: any, targetUser: UserProfile & {id: string}) {
    const batch = writeBatch(db);
    const currentUserFamilyRef = doc(db, "users", currentUser.uid, "familyMembers", targetUser.id);
    batch.set(currentUserFamilyRef, {
        userId: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        avatarUrl: targetUser.avatarUrl,
        status: 'requested',
    });
    const targetUserFamilyRef = doc(db, "users", targetUser.id, "familyMembers", currentUser.uid);
    batch.set(targetUserFamilyRef, {
        userId: currentUser.uid,
        name: currentUser.displayName,
        email: currentUser.email,
        avatarUrl: currentUser.photoURL,
        status: 'pending',
    });
    await batch.commit();
}

async function acceptFamilyRequest(db: any, currentUser: any, memberId: string) {
    const batch = writeBatch(db);
    const yourFamilyMemberRef = doc(db, "users", currentUser.uid, "familyMembers", memberId);
    batch.update(yourFamilyMemberRef, { status: 'accepted' });
    const theirFamilyMemberRef = doc(db, "users", memberId, "familyMembers", currentUser.uid);
    batch.update(theirFamilyMemberRef, { status: 'accepted' });
    await batch.commit();
}

const FamilyChat = ({ user, firestore }: { user: any, firestore: any }) => {
    const familyId = user.uid; // Use the user's own UID as the ID for their family chat
    const messagesRef = useMemoFirebase(
        () => firestore ? query(collection(firestore, `family-chats/${familyId}/messages`), orderBy("timestamp", "asc")) : null,
        [firestore, familyId]
    );
    const { data: messages, isLoading } = useCollection<ChatMessage>(messagesRef);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !firestore) return;
        const messageData = {
            text: newMessage,
            userId: user.uid,
            userName: user.displayName || "Unknown User",
            userAvatarUrl: user.photoURL || "",
            timestamp: serverTimestamp(),
        };
        await addDoc(collection(firestore, `family-chats/${familyId}/messages`), messageData);
        setNewMessage("");
    };

    const getFamilyName = () => {
        const name = user?.displayName || "";
        const lastName = name.split(' ').pop();
        return lastName ? `Familia ${lastName}` : "Chat Familiar";
    }
    
    return (
        <Card className="flex flex-col h-[400px]">
            <CardHeader>
                <CardTitle>{getFamilyName()}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <div className="flex h-full flex-col">
                    <div className="flex-1 space-y-4 p-4 overflow-y-auto">
                        {isLoading && <p className="text-center">Cargando mensajes...</p>}
                        {!isLoading && messages && messages.map((msg) => (
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
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t p-4">
                        <Input placeholder="Escribe un mensaje..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                        <Button type="submit"><Send /></Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
};


export default function FamilyPage() {
  const { user, isUserLoading, auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const familyQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/familyMembers`) : null),
    [firestore, user]
  );
  const { data: familyMembers, isLoading: isLoadingFamily } = useCollection<FamilyMember>(familyQuery);

  const userProfileQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users') : null),
    [firestore, user]
  );
  const { data: userProfiles } = useCollection<UserProfile>(userProfileQuery);

  const acceptedFamilyMembers = familyMembers?.filter(m => m.status === 'accepted') || [];
  const acceptedMemberIds = acceptedFamilyMembers.map(m => m.userId);

  const familyAlertsQuery = useMemoFirebase(() => {
    if (!firestore || acceptedMemberIds.length === 0) return null;
    return query(
        collection(firestore, "sos-alerts"), 
        where('userId', 'in', acceptedMemberIds),
        orderBy("timestamp", "desc"),
        limit(1)
    );
  }, [firestore, acceptedMemberIds]);
  const { data: familyAlerts, isLoading: isLoadingAlerts } = useCollection<SosAlert>(familyAlertsQuery);


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
  
  const handleSearchAndAdd = async () => {
    if (!firestore || !user || !searchEmail) return;
    setIsSearching(true);
    try {
      const targetUser = await findUserByEmail(firestore, searchEmail);
      if (!targetUser) {
        toast({ title: "Usuario no encontrado", description: "No se encontró ningún usuario con ese correo electrónico.", variant: "destructive" });
      } else if (targetUser.id === user.uid) {
        toast({ title: "Acción no permitida", description: "No puedes agregarte a ti mismo como familiar.", variant: "destructive" });
      }
      else {
        await sendFamilyRequest(firestore, user, targetUser);
        toast({ title: "Solicitud Enviada", description: `Se ha enviado una solicitud a ${targetUser.name}.` });
        setSearchEmail("");
      }
    } catch (error) {
      console.error("Error adding family member:", error);
      toast({ title: "Error", description: "No se pudo enviar la solicitud.", variant: "destructive" });
    }
    setIsSearching(false);
  };
  
  const handleAcceptRequest = async (memberId: string) => {
    if (!firestore || !user) return;
    try {
        await acceptFamilyRequest(firestore, user, memberId);
        toast({ title: "Solicitud Aceptada", description: "Ahora son parte de tu familia en la app." });
    } catch (error) {
        console.error("Error accepting request:", error);
        toast({ title: "Error", description: "No se pudo aceptar la solicitud.", variant: "destructive" });
    }
  };

  const familyLocations = userProfiles
    ?.filter(p => acceptedMemberIds.includes(p.id) && p.location)
    .map(p => {
        const loc = parseLocation(p.location!);
        if (!loc) return null;
        return { ...loc, label: p.name.split(' ')[0] }; // Use first name as label
    })
    .filter(Boolean) as { lat: number; lng: number, label: string }[];


  if (isUserLoading || !user || !firestore) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <AppShell user={user} onSignOut={handleSignOut}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
            <FamilyChat user={user} firestore={firestore} />
            <Card>
                <CardHeader>
                    <CardTitle>Alertas Familiares</CardTitle>
                    <CardDescription>Alertas recientes enviadas por tus familiares.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingAlerts ? (
                         <div className="flex flex-col items-center justify-center p-6 text-sm text-muted-foreground">
                            <Loader className="h-6 w-6 animate-spin"/>
                            <p className="mt-2">Cargando alertas...</p>
                        </div>
                    ) : familyAlerts && familyAlerts.length > 0 ? (
                        <AlertCard alert={familyAlerts[0]} />
                    ) : (
                         <div className="flex flex-col items-center justify-center p-6 text-sm text-muted-foreground">
                            <AlertCircle className="mx-auto h-8 w-8"/>
                            <p className="mt-2">No hay alertas familiares recientes.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mapa Familiar</CardTitle>
                    <CardDescription>Visualiza la última ubicación conocida de tus familiares aceptados.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative h-64 w-full rounded-lg overflow-hidden">
                        <LeafletMapComponent markers={familyLocations} />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Añadir Familiar</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Input 
                        type="email" 
                        placeholder="correo@ejemplo.com"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)} 
                    />
                    <Button onClick={handleSearchAndAdd} disabled={isSearching}>
                        {isSearching ? <Loader className="animate-spin" /> : <UserPlus />}
                    </Button>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Mi Familia</CardTitle>
                    <CardDescription>Gestiona tus familiares y sus solicitudes.</CardDescription>
                </CardHeader>
                <CardContent>
                {isLoadingFamily ? (
                    <p>Cargando familiares...</p>
                ) : (
                    <ul className="space-y-4">
                    {familyMembers && familyMembers.length > 0 ? (
                        familyMembers.map((member) => (
                        <li key={member.id} className="flex items-center justify-between gap-4 p-2 rounded-lg bg-secondary/50">
                            <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={member.avatarUrl} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                            </div>
                            <div>
                            {member.status === 'pending' && (
                                <Button size="sm" onClick={() => handleAcceptRequest(member.id)}>
                                <Check className="mr-2 h-4 w-4" /> Aceptar
                                </Button>
                            )}
                            {member.status === 'requested' && <p className="text-xs text-muted-foreground pr-2">Solicitud enviada</p>}
                            {member.status === 'accepted' && <p className="text-xs text-green-500 pr-2">Aceptado</p>}
                            </div>
                        </li>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground">Aún no has añadido a ningún familiar.</p>
                    )}
                    </ul>
                )}
                </CardContent>
            </Card>
        </div>
      </div>
    </AppShell>
  );
}
