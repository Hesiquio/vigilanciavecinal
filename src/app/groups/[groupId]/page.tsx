
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFirebase, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs, writeBatch, addDoc, serverTimestamp, orderBy, updateDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import type { GroupMember, UserProfile, ChatMessage, Group } from "@/types";
import { Loader, UserPlus, Check, Send, AlertCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
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

async function sendGroupRequest(db: any, currentUser: any, targetUser: UserProfile & {id: string}, groupId: string, groupName: string) {
    const batch = writeBatch(db);
    // Add pending member to the group's member list
    const groupMemberRef = doc(db, "groups", groupId, "members", targetUser.id);
    batch.set(groupMemberRef, {
        userId: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        avatarUrl: targetUser.avatarUrl,
        status: 'pending',
        isSharingLocation: false, // Default to not sharing
        location: targetUser.location || '',
    });
    // Add requested group to the target user's group list
    const targetUserGroupRef = doc(db, "users", targetUser.id, "groups", groupId);
    batch.set(targetUserGroupRef, {
        name: groupName,
        status: 'pending'
    });
    await batch.commit();
}


async function acceptGroupRequest(db: any, currentUser: any, memberId: string, groupId: string) {
    const batch = writeBatch(db);
    const groupMemberRef = doc(db, "groups", groupId, "members", memberId);
    batch.update(groupMemberRef, { status: 'accepted' });
    await batch.commit();
}


const GroupChat = ({ user, firestore, groupId, groupName }: { user: any, firestore: any, groupId: string, groupName: string }) => {
    const messagesRef = useMemoFirebase(
        () => firestore && groupId ? query(collection(firestore, `group-chats/${groupId}/messages`), orderBy("timestamp", "asc")) : null,
        [firestore, groupId]
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
        await addDoc(collection(firestore, `group-chats/${groupId}/messages`), messageData);
        setNewMessage("");
    };

    return (
        <Card className="flex flex-col h-[400px]">
            <CardHeader>
                <CardTitle>{groupName || "Chat de Grupo"}</CardTitle>
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


export default function GroupDetailPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const { user, isUserLoading, auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const groupDocRef = useMemoFirebase(
    () => (firestore && groupId ? doc(firestore, 'groups', groupId) : null),
    [firestore, groupId]
  );
  const { data: groupData, isLoading: isLoadingGroupData } = useDoc<Group>(groupDocRef);
  
  const membersQuery = useMemoFirebase(
    () => (firestore && groupId ? collection(firestore, `groups/${groupId}/members`) : null),
    [firestore, groupId]
  );
  const { data: members, isLoading: isLoadingMembers } = useCollection<GroupMember>(membersQuery);
  
  const currentUserMemberInfo = members?.find(m => m.userId === user?.uid);

  const groupMapMarkers = useMemo(() => {
    if (!members) return [];
    return members
      .filter(member => member.isSharingLocation && member.location)
      .map(member => {
        const coords = parseLocation(member.location!);
        return coords ? { ...coords, label: member.name } : null;
      })
      .filter(Boolean) as { lat: number; lng: number; label: string }[];
  }, [members]);


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
    if (!firestore || !user || !searchEmail || !groupData) return;
    setIsSearching(true);
    try {
      const targetUser = await findUserByEmail(firestore, searchEmail);
      if (!targetUser) {
        toast({ title: "Usuario no encontrado", description: "No se encontró ningún usuario con ese correo electrónico.", variant: "destructive" });
      } else if (targetUser.id === user.uid) {
        toast({ title: "Acción no permitida", description: "Ya eres miembro de este grupo.", variant: "destructive" });
      }
      else {
        await sendGroupRequest(firestore, user, targetUser, groupId, groupData.name);
        toast({ title: "Solicitud Enviada", description: `Se ha enviado una solicitud a ${targetUser.name} para unirse al grupo.` });
        setSearchEmail("");
      }
    } catch (error) {
      console.error("Error adding group member:", error);
      toast({ title: "Error", description: "No se pudo enviar la solicitud.", variant: "destructive" });
    }
    setIsSearching(false);
  };
  
  const handleAcceptRequest = async (memberId: string) => {
    if (!firestore || !user) return;
    try {
        await acceptGroupRequest(firestore, user, memberId, groupId);
        toast({ title: "Solicitud Aceptada", description: "El usuario ahora es miembro del grupo." });
    } catch (error) {
        console.error("Error accepting request:", error);
        toast({ title: "Error", description: "No se pudo aceptar la solicitud.", variant: "destructive" });
    }
  };
  
  const handleLocationSharingChange = async (isSharing: boolean) => {
      if (!firestore || !user) return;
      const memberRef = doc(firestore, "groups", groupId, "members", user.uid);
      try {
          await updateDoc(memberRef, { isSharingLocation: isSharing });
          toast({ title: "Preferencia guardada", description: `Compartir ubicación ${isSharing ? 'activado' : 'desactivado'}.` });
      } catch (error) {
          console.error("Error updating location sharing preference:", error);
          toast({ title: "Error", description: "No se pudo guardar tu preferencia.", variant: "destructive" });
      }
  }

  const userProfileRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const mapCenter = useMemo(() => userProfile?.location ? parseLocation(userProfile.location) : undefined, [userProfile]);


  if (isUserLoading || isLoadingGroupData || !user || !firestore) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <AppShell user={user} onSignOut={handleSignOut}>
       <Link href="/groups" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Volver a Mis Grupos
      </Link>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
            <GroupChat user={user} firestore={firestore} groupId={groupId} groupName={groupData?.name || ''} />
            <Card>
                <CardHeader>
                    <CardTitle>Alertas del Grupo</CardTitle>
                    <CardDescription>Alertas recientes enviadas en este grupo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
                    <AlertCircle className="mx-auto h-8 w-8"/>
                    <p>La funcionalidad de alertas de grupo está en construcción.</p>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
             <Card>
                <CardHeader className="pb-4">
                    <CardTitle>Mapa del Grupo</CardTitle>
                    <CardDescription>Ubicación de miembros que comparten su posición.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4">
                        <LeafletMapComponent center={mapCenter} markers={groupMapMarkers}/>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch 
                            id="location-sharing"
                            checked={currentUserMemberInfo?.isSharingLocation || false}
                            onCheckedChange={handleLocationSharingChange}
                            disabled={isLoadingMembers}
                         />
                        <Label htmlFor="location-sharing">Compartir mi ubicación con este grupo</Label>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Añadir Miembro</CardTitle>
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
                    <CardTitle>Miembros del Grupo</CardTitle>
                    <CardDescription>Gestiona los miembros y sus solicitudes.</CardDescription>
                </CardHeader>
                <CardContent>
                {isLoadingMembers ? (
                    <p>Cargando miembros...</p>
                ) : (
                    <ul className="space-y-4">
                    {members && members.length > 0 ? (
                        members.map((member) => (
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
                            {/* This logic is simplified: only shows for owner/admin in a real app */}
                            {member.status === 'pending' && user.uid === groupData?.ownerId && (
                                <Button size="sm" onClick={() => handleAcceptRequest(member.id)}>
                                <Check className="mr-2 h-4 w-4" /> Aceptar
                                </Button>
                            )}
                            {member.status === 'pending' && user.uid !== groupData?.ownerId && <p className="text-xs text-muted-foreground pr-2">Pendiente</p>}
                            {member.status === 'requested' && <p className="text-xs text-muted-foreground pr-2">Solicitud enviada</p>}
                            {member.status === 'accepted' && <p className="text-xs text-green-500 pr-2">Miembro</p>}
                            </div>
                        </li>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground">Este grupo aún no tiene miembros.</p>
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
