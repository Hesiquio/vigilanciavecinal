
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
import { collection, query, where, getDocs, writeBatch, addDoc, serverTimestamp, orderBy, updateDoc, setDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import type { FamilyMember, UserProfile, ChatMessage } from "@/types";
import { Loader, UserPlus, Check, Send, AlertCircle, XCircle, MapPin, MapPinOff, Edit, ChevronsUpDown } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


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


const FamilyChat = ({ user, firestore, userProfile, onUpdateName }: { user: any, firestore: any, userProfile: UserProfile | null, onUpdateName: (name: string) => Promise<void> }) => {
    const familyId = user.uid; // Use the user's own UID as the ID for their family chat
    const messagesRef = useMemoFirebase(
        () => firestore ? query(collection(firestore, `family-chats/${familyId}/messages`), orderBy("timestamp", "asc")) : null,
        [firestore, familyId]
    );
    const { data: messages, isLoading } = useCollection<ChatMessage>(messagesRef);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState("");
    const [isSavingName, setIsSavingName] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        setNewFamilyName(userProfile?.familyName || getFamilyName(true));
    }, [userProfile]);

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

    const getFamilyName = (getDefault = false) => {
        if (userProfile?.familyName && !getDefault) {
            return userProfile.familyName;
        }
        const name = user?.displayName || "";
        const lastName = name.split(' ').pop();
        return lastName ? `Familia ${lastName}` : "Chat Familiar";
    }

    const handleSaveName = async () => {
        setIsSavingName(true);
        await onUpdateName(newFamilyName);
        setIsSavingName(false);
        setIsNameDialogOpen(false);
    }
    
    return (
        <>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <Card>
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer">
                            <CardTitle className="flex items-center gap-2">
                                {getFamilyName()}
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setIsNameDialogOpen(true);}}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                <ChevronsUpDown className="h-4 w-4" />
                                <span className="sr-only">Toggle</span>
                            </Button>
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="flex flex-col h-[400px]">
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
                        </div>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Nombre de la Familia</DialogTitle>
                        <DialogDescription>
                            Elige un nombre para tu chat familiar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="family-name">Nombre de la Familia</Label>
                            <Input
                                id="family-name"
                                value={newFamilyName}
                                onChange={(e) => setNewFamilyName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNameDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveName} disabled={isSavingName}>
                            {isSavingName ? <Loader className="animate-spin" /> : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
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
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isCurrentUserSharing = useMemo(() => {
    return userProfile?.isSharingLocationWithFamily ?? false;
  }, [userProfile]);

  const familyMapMarkers = useMemo(() => {
    const markers = [];
    if (isCurrentUserSharing && userProfile?.location) {
        const coords = parseLocation(userProfile.location);
        if (coords) markers.push({ ...coords, label: `${user?.displayName?.split(' ')[0] || 'Tú'} (Tú)` });
    }

    if (familyMembers) {
      familyMembers.forEach(member => {
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
    if (!firestore || !user || !userProfileRef || !familyMembers) return;

    const batch = writeBatch(firestore);

    // 1. Update the central flag on the user's own profile
    batch.update(userProfileRef, { isSharingLocationWithFamily: isSharing });

    // 2. Propagate this change to all accepted family members' views of this user
    const acceptedMembers = familyMembers.filter(m => m.status === 'accepted');
    acceptedMembers.forEach(member => {
        // This is the reference to the current user's document inside their family member's subcollection
        const theirFamilyMemberRef = doc(firestore, "users", member.userId, "familyMembers", user.uid);
        batch.update(theirFamilyMemberRef, { 
            isSharingLocation: isSharing,
            location: isSharing && userProfile?.location ? userProfile.location : '' 
        });
    });

    try {
        await batch.commit();
        toast({ title: "Preferencia guardada", description: `Compartir ubicación con familia ${isSharing ? 'activado' : 'desactivado'}.` });
    } catch (error) {
        console.error("Error updating location sharing preference:", error);
        toast({ title: "Error", description: "No se pudo guardar tu preferencia.", variant: "destructive" });
    }
};

const handleUpdateFamilyName = async (name: string) => {
    if (!userProfileRef) return;
    try {
        await setDoc(userProfileRef, { familyName: name }, { merge: true });
        toast({ title: "Nombre actualizado", description: "El nombre de tu familia ha sido guardado." });
    } catch (error) {
        console.error("Error updating family name:", error);
        toast({ title: "Error", description: "No se pudo guardar el nuevo nombre.", variant: "destructive" });
    }
};

  
  if (isUserLoading || isProfileLoading || !user || !firestore) {
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
            <FamilyChat user={user} firestore={firestore} userProfile={userProfile} onUpdateName={handleUpdateFamilyName} />
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
                            disabled={isLoadingFamily || isProfileLoading}
                         />
                        <Label htmlFor="location-sharing-family">Compartir mi ubicación con mi familia</Label>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Estado de Familiares</h3>
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
                                        {member.status === 'accepted' ? (
                                            <div className={cn("flex items-center gap-1 text-xs", member.isSharingLocation ? 'text-green-500' : 'text-muted-foreground')}>
                                                {member.isSharingLocation ? <MapPin className="h-3 w-3" /> : <MapPinOff className="h-3 w-3" />}
                                                <span>{member.isSharingLocation ? 'Compartiendo ubicación' : 'Ubicación desactivada'}</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        )}
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
                                    </div>
                                </li>
                                ))
                            ) : (
                                <p className="text-center text-sm text-muted-foreground">Aún no has añadido a ningún familiar.</p>
                            )}
                            </ul>
                        )}
                    </div>
                    
                    <Separator className="my-6" />

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Añadir Familiar</h3>
                         <div className="flex gap-2">
                            <Input 
                                type="email" 
                                placeholder="correo@ejemplo.com"
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)} 
                            />
                            <Button onClick={handleSearchAndAdd} disabled={isSearching}>
                                {isSearching ? <Loader className="animate-spin" /> : <UserPlus />}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppShell>
  );
}

    
    

    