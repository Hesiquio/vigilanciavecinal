
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { collection, query, where, getDocs, writeBatch, addDoc, serverTimestamp, orderBy, updateDoc, deleteDoc, getDocsFromCache } from "firebase/firestore";
import { doc } from "firebase/firestore";
import type { GroupMember, UserProfile, ChatMessage, Group, UserGroup } from "@/types";
import { Loader, UserPlus, Check, Send, AlertCircle, ArrowLeft, XCircle, Trash2, Edit } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";


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

async function sendGroupRequest(db: any, targetUser: UserProfile & {id: string}, groupId: string, groupName: string) {
    const batch = writeBatch(db);
    const groupMemberRef = doc(db, "groups", groupId, "members", targetUser.id);
    batch.set(groupMemberRef, {
        userId: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        avatarUrl: targetUser.avatarUrl,
        status: 'pending',
        isSharingLocation: false,
        location: targetUser.location || '',
    });
    
    const userGroupRef = doc(db, "users", targetUser.id, "groups", groupId);
    batch.set(userGroupRef, {
        name: groupName,
        status: 'pending'
    });

    await batch.commit();
}


async function acceptGroupRequest(db: any, userId: string, groupId: string) {
    const batch = writeBatch(db);
    const groupMemberRef = doc(db, "groups", groupId, "members", userId);
    batch.update(groupMemberRef, { status: 'accepted' });

    const userGroupRef = doc(db, "users", userId, "groups", groupId);
    batch.update(userGroupRef, { status: 'accepted' });
    
    await batch.commit();
}

async function removeOrCancelGroupMember(db: any, memberId: string, groupId: string) {
    const batch = writeBatch(db);
    const groupMemberRef = doc(db, "groups", groupId, "members", memberId);
    batch.delete(groupMemberRef);
    const userGroupRef = doc(db, "users", memberId, "groups", groupId);
    batch.delete(userGroupRef);
    await batch.commit();
}


const GroupChat = ({ user, firestore, groupId, groupName, isOwner, onEdit, onDelete }: { user: any, firestore: any, groupId: string, groupName: string, isOwner: boolean, onEdit: () => void, onDelete: () => void }) => {
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
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{groupName || "Chat de Grupo"}</CardTitle>
                 {isOwner && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={onEdit}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar Nombre</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Eliminar Grupo</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este grupo?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción es permanente y eliminará el grupo, todos sus miembros y el historial de chat. No se puede deshacer.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={onDelete}>Sí, eliminar grupo</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-0 flex-1">
                <div className="flex flex-col">
                    <div className="flex-1 space-y-4 p-4 overflow-y-auto max-h-[500px]">
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


export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { user, isUserLoading, auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

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
  
  const currentUserMemberInfo = useMemo(() => members?.find(m => m.userId === user?.uid), [members, user]);

  const userProfileRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (groupData) {
        setNewGroupName(groupData.name);
    }
  }, [groupData]);

  const groupMapMarkers = useMemo(() => {
    const markers = [];
    
    // Add current user's marker if they are sharing location
    if (currentUserMemberInfo?.isSharingLocation && userProfile?.location) {
        const coords = parseLocation(userProfile.location);
        if (coords) markers.push({ ...coords, label: `${user?.displayName?.split(' ')[0] || 'Tú'} (Tú)` });
    }

    // Add other members' markers
    if (members) {
      members.forEach(member => {
        // Exclude the current user to avoid duplicates
        if (member.userId !== user?.uid && member.status === 'accepted' && member.isSharingLocation && member.location) {
          const coords = parseLocation(member.location);
          if (coords) {
            markers.push({ ...coords, label: member.name.split(' ')[0] });
          }
        }
      });
    }
    return markers;
  }, [members, user, userProfile, currentUserMemberInfo]);


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
      } else if (members?.some(m => m.userId === targetUser.id)) {
        toast({ title: "Acción no permitida", description: "Este usuario ya es miembro o tiene una invitación pendiente.", variant: "destructive" });
      }
      else {
        await sendGroupRequest(firestore, targetUser, groupId, groupData.name);
        toast({ title: "Solicitud Enviada", description: `Se ha enviado una solicitud a ${targetUser.name} para unirse al grupo.` });
        setSearchEmail("");
      }
    } catch (error) {
      console.error("Error adding group member:", error);
      toast({ title: "Error", description: "No se pudo enviar la solicitud.", variant: "destructive" });
    }
    setIsSearching(false);
  };
  
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!firestore) return;
    try {
        await removeOrCancelGroupMember(firestore, memberId, groupId);
        toast({ title: "Miembro Eliminado", description: `${memberName} ha sido eliminado del grupo.` });
    } catch (error) {
        console.error("Error removing member:", error);
        toast({ title: "Error", description: "No se pudo eliminar al miembro.", variant: "destructive" });
    }
  };


  const handleLocationSharingChange = async (isSharing: boolean) => {
      if (!firestore || !user || !userProfile) return;
      const memberRef = doc(firestore, "groups", groupId, "members", user.uid);
      try {
          await updateDoc(memberRef, { 
            isSharingLocation: isSharing,
            location: isSharing ? userProfile.location : ''
           });
          toast({ title: "Preferencia guardada", description: `Compartir ubicación ${isSharing ? 'activado' : 'desactivado'}.` });
      } catch (error) {
          console.error("Error updating location sharing preference:", error);
          toast({ title: "Error", description: "No se pudo guardar tu preferencia.", variant: "destructive" });
      }
  }

  const mapCenter = useMemo(() => userProfile?.location ? parseLocation(userProfile.location) : undefined, [userProfile]);
  
  const handleUpdateGroupName = async () => {
    if (!firestore || !groupData || !newGroupName.trim()) {
        toast({ title: "Error", description: "El nombre no puede estar vacío.", variant: "destructive" });
        return;
    }
    setIsSavingName(true);
    const batch = writeBatch(firestore);
    const groupRef = doc(firestore, "groups", groupId);
    batch.update(groupRef, { name: newGroupName });

    // Update the group name in each member's user-groups subcollection
    if (members) {
        for (const member of members) {
            const userGroupRef = doc(firestore, "users", member.userId, "groups", groupId);
            batch.update(userGroupRef, { name: newGroupName });
        }
    }
    try {
        await batch.commit();
        toast({ title: "Nombre Actualizado", description: "El nombre del grupo ha sido actualizado." });
        setIsEditDialogOpen(false);
    } catch (error) {
        console.error("Error updating group name:", error);
        toast({ title: "Error", description: "No se pudo actualizar el nombre del grupo.", variant: "destructive" });
    }
    setIsSavingName(false);
  }

  const handleDeleteGroup = async () => {
    if (!firestore || !members) {
      toast({ title: "Error", description: "No se puede eliminar el grupo.", variant: "destructive" });
      return;
    }
    const batch = writeBatch(firestore);
    // Delete the group document itself
    const groupRef = doc(firestore, "groups", groupId);
    batch.delete(groupRef);

    // Delete all members from the group's subcollection
    // and delete the group from each member's user-groups subcollection
    for (const member of members) {
        const memberRef = doc(firestore, "groups", groupId, "members", member.userId);
        batch.delete(memberRef);
        const userGroupRef = doc(firestore, "users", member.userId, "groups", groupId);
        batch.delete(userGroupRef);
    }
    
    // Also need to delete chat history
    const chatRef = collection(firestore, `group-chats/${groupId}/messages`);
    // Firestore doesn't support deleting collections from the client-side efficiently.
    // This needs a backend function. For now, we will leave the chat messages.

    try {
      await batch.commit();
      toast({ title: "Grupo Eliminado", description: "El grupo ha sido eliminado permanentemente." });
      router.push("/groups");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast({ title: "Error", description: "No se pudo eliminar el grupo.", variant: "destructive" });
    }
  }

  if (isUserLoading || isLoadingGroupData || !user || !firestore) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  const isOwner = user.uid === groupData?.ownerId;

  return (
    <AppShell user={user} onSignOut={handleSignOut}>
       <Link href="/groups" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Volver a Mis Grupos
      </Link>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
            <GroupChat 
                user={user} 
                firestore={firestore} 
                groupId={groupId} 
                groupName={groupData?.name || ''} 
                isOwner={isOwner}
                onEdit={() => setIsEditDialogOpen(true)}
                onDelete={handleDeleteGroup}
            />
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
                    <div>
                        <CardTitle>Mapa del Grupo</CardTitle>
                        <CardDescription>Ubicación de miembros que comparten su posición.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4">
                        <GoogleMapComponent center={mapCenter} markers={groupMapMarkers}/>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch 
                            id="location-sharing"
                            checked={currentUserMemberInfo?.isSharingLocation || false}
                            onCheckedChange={handleLocationSharingChange}
                            disabled={isLoadingMembers || !currentUserMemberInfo}
                         />
                        <Label htmlFor="location-sharing">Compartir mi ubicación con este grupo</Label>
                    </div>
                </CardContent>
            </Card>
            {isOwner && (
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
            )}
            
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
                            <div className="flex items-center gap-2">
                            {isOwner && member.userId !== user.uid && (
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive">
                                            <XCircle className="mr-2 h-4 w-4" /> 
                                            {member.status === 'pending' ? 'Cancelar' : 'Eliminar'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {member.status === 'pending'
                                                ? `Esto cancelará la invitación enviada a ${member.name}.`
                                                : `Esto eliminará a ${member.name} del grupo.`
                                            }
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cerrar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveMember(member.id, member.name)}>Confirmar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            {member.status === 'pending' && !isOwner && <p className="text-xs text-muted-foreground pr-2">Pendiente</p>}
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
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Nombre del Grupo</DialogTitle>
                    <DialogDescription>
                        Elige un nuevo nombre para tu grupo.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="group-name">Nombre del Grupo</Label>
                        <Input
                            id="group-name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleUpdateGroupName} disabled={isSavingName}>
                        {isSavingName ? <Loader className="animate-spin" /> : "Guardar Cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </AppShell>
  );
}

    

    