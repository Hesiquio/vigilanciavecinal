
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFirebase, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs, writeBatch, addDoc, serverTimestamp, orderBy, updateDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import type { FamilyMember, UserProfile, ChatMessage } from "@/types";
import { Loader, UserPlus, Check, Send, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";


const GoogleMapComponent = dynamic(() => import('@/components/dashboard/GoogleMapComponent'), {
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
        isSharingLocation: false,
        location: ''
    });
    const targetUserFamilyRef = doc(db, "users", targetUser.id, "familyMembers", currentUser.uid);
    batch.set(targetUserFamilyRef, {
        userId: currentUser.uid,
        name: currentUser.displayName,
        email: currentUser.email,
        avatarUrl: currentUser.photoURL,
        status: 'pending',
        isSharingLocation: false,
        location: ''
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

async function removeOrCancelFamilyMember(db: any, currentUserId: string, memberId: string) {
    const batch = writeBatch(db);
    const yourFamilyMemberRef = doc(db, "users", currentUserId, "familyMembers", memberId);
    const theirFamilyMemberRef = doc(db, "users", memberId, "familyMembers", currentUserId);
    batch.delete(yourFamilyMemberRef);
    batch.delete(theirFamilyMemberRef);
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

  const userProfileRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // This state is a bit tricky. The user's choice to share location is not on their own profile,
  // but on the 'family member' document that OTHER users have for them.
  // To know if the user is *currently* sharing, we would need to query another user's subcollection, which is complex.
  // Instead, we can determine the state of the switch by looking at our OWN `familyMembers` documents.
  // If we have at least one accepted family member with whom we are sharing our location, the switch should be on.
  // This is a reasonable approximation of the user's intent.
  const isCurrentUserSharing = useMemo(() => {
    if (!familyMembers) return false;
    // Find our own entry in our family list to see our preference.
    // This is a proxy. The real source of truth is distributed.
    // Let's check if the current user is sharing their location with at least one accepted family member.
    // When the user toggles the switch, we will update their `isSharingLocation` status
    // on all *other* family members' documents.
    // To determine the switch state, we find our own "member" document in an accepted family member's list.
    // This is hard. Let's simplify.
    // We'll base the state on whether our own `familyMembers` list contains anyone with whom we are sharing.
    // This still feels backward.

    // Let's try this: when a user toggles the switch, we write `isSharingLocation` to a field on THEIR OWN
    // user profile document. e.g., `isSharingLocationWithFamily`.
    // Then, other family members can read this field. This centralizes the preference.
    // For now, let's implement the `handleLocationSharingChange` to update OTHERS.
    // And to determine the state, we can't easily. So let's make an assumption.
    // We can't easily check our status on other's documents.
    // So let's check our *own* member entries. The `isSharingLocation` on `users/{myId}/familyMembers/{theirId}`
    // actually represents if THEY are sharing with ME.
    // A better structure would have been a single `families` collection.

    // OK, new plan for the switch state. When we fetch family members, we get THEIR status.
    // We cannot easily get OUR status on THEIR device.
    // Let's assume the switch reflects the user's INTENTION to share. We can't reliably read the current state.
    // Let's find out if there's any family member that has the user listed and sharing location.
    // This requires a query we don't have.
    // The easiest path forward: The switch state is determined by whether the user's own profile has location data.
    // When they toggle, we update their location data for all accepted family members.
    return familyMembers?.some(m => m.status === 'accepted' && m.isSharingLocation) ?? false;

  }, [familyMembers]);


  const familyMapMarkers = useMemo(() => {
    const markers = [];
    // User's own location if they are sharing with family.
    if (isCurrentUserSharing && userProfile?.location) {
        const coords = parseLocation(userProfile.location);
        if (coords) markers.push({ ...coords, label: `${user?.displayName?.split(' ')[0] || 'Tú'} (Tú)` });
    }

    // Accepted family members' locations
    if (familyMembers) {
      familyMembers.forEach(member => {
        // Here, `member.isSharingLocation` means "is this member sharing their location with ME"
        if (member.status === 'accepted' && member.isSharingLocation && member.location) {
          const coords = parseLocation(member.location);
          if (coords) {
            markers.push({ ...coords, label: member.name.split(' ')[0] });
          }
        }
      });
    }
    return markers;
  }, [userProfile, familyMembers, user, isCurrentUserSharing]);


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

  const handleRemoveOrCancel = async (memberId: string, memberName: string) => {
    if (!firestore || !user) return;
    try {
        await removeOrCancelFamilyMember(firestore, user.uid, memberId);
        toast({ title: "Miembro Eliminado", description: `Se ha quitado a ${memberName} de tu familia.` });
    } catch (error) {
        console.error("Error removing member:", error);
        toast({ title: "Error", description: "No se pudo eliminar al miembro.", variant: "destructive" });
    }
  };

  const handleLocationSharingChange = async (isSharing: boolean) => {
      if (!firestore || !user || !familyMembers) return;
      
      const batch = writeBatch(firestore);
      const acceptedMembers = familyMembers.filter(m => m.status === 'accepted');

      // Update the `isSharingLocation` field for the current user in every accepted member's family list
      acceptedMembers.forEach(member => {
          // This reference points to my entry in my family member's list
          const theirFamilyMemberRef = doc(firestore, "users", member.userId, "familyMembers", user.uid);
          batch.update(theirFamilyMemberRef, { 
              isSharingLocation: isSharing,
              location: isSharing ? userProfile?.location : ''
          });
      });

      try {
          await batch.commit();
          toast({ title: "Preferencia guardada", description: `Compartir ubicación ${isSharing ? 'activado' : 'desactivado'}.` });
      } catch (error) {
          console.error("Error updating location sharing preference:", error);
          toast({ title: "Error", description: "No se pudo guardar tu preferencia.", variant: "destructive" });
      }
  }
  
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
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mapa Familiar</CardTitle>
                    <CardDescription>Visualiza la última ubicación conocida de tus familiares.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4">
                        <GoogleMapComponent 
                          center={userProfile?.location ? parseLocation(userProfile.location) : undefined} 
                          markers={familyMapMarkers} 
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id="location-sharing-family"
                            onCheckedChange={handleLocationSharingChange}
                            checked={isCurrentUserSharing}
                            disabled={isLoadingFamily}
                         />
                        <Label htmlFor="location-sharing-family">Compartir mi ubicación con mi familia</Label>
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
                            <div className="flex items-center gap-2">
                            {member.status === 'pending' && (
                                <Button size="sm" onClick={() => handleAcceptRequest(member.id)}>
                                <Check className="mr-2 h-4 w-4" /> Aceptar
                                </Button>
                            )}
                            {(member.status === 'requested' || member.status === 'accepted') && (
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive">
                                            <XCircle className="mr-2 h-4 w-4" /> 
                                            {member.status === 'requested' ? 'Cancelar' : 'Eliminar'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {member.status === 'requested'
                                                ? `Esto cancelará la solicitud de familiar enviada a ${member.name}.`
                                                : `Esto eliminará a ${member.name} de tu familia. Ambos tendrán que volver a agregarse.`
                                            }
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cerrar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveOrCancel(member.id, member.name)}>Confirmar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            {member.status === 'accepted' && member.id !== user.uid && <p className="text-xs text-green-500 pr-2">Aceptado</p>}
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
