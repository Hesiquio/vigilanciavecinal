
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { doc } from "firebase/firestore";
import type { FamilyMember, UserProfile } from "@/types";
import { Loader, UserPlus, Check, X, Send, AlertCircle } from "lucide-react";
import GoogleMap from "@/components/dashboard/GoogleMap";

// Helper functions (could be moved to a separate file)
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

    // Add to your own family list with "requested" status
    const currentUserFamilyRef = doc(db, "users", currentUser.uid, "familyMembers", targetUser.id);
    batch.set(currentUserFamilyRef, {
        userId: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        avatarUrl: targetUser.avatarUrl,
        status: 'requested',
    });

    // Add to their family list with "pending" status
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
    
    // Update your status to "accepted"
    const yourFamilyMemberRef = doc(db, "users", currentUser.uid, "familyMembers", memberId);
    batch.update(yourFamilyMemberRef, { status: 'accepted' });

    // Update their status to "accepted"
    const theirFamilyMemberRef = doc(db, "users", memberId, "familyMembers", currentUser.uid);
    batch.update(theirFamilyMemberRef, { status: 'accepted' });

    await batch.commit();
}


export default function FamilyPage() {
  const { user, isUserLoading, auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Firestore query for family members
  const familyQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/familyMembers`) : null),
    [firestore, user]
  );
  const { data: familyMembers, isLoading: isLoadingFamily } = useCollection<FamilyMember>(familyQuery);

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
        toast({ title: "Solicitud Enviada", description: `Se ha enviado una solicitud de amistad a ${targetUser.name}.` });
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

  const acceptedFamilyMembers = familyMembers?.filter(m => m.status === 'accepted') || [];
  const familyLocations = acceptedFamilyMembers
    .map(m => (m as any).location) // Need to get location from user profile doc
    .filter(Boolean);

  const getFamilyName = () => {
    const name = user?.displayName || "";
    const lastName = name.split(' ').pop();
    return lastName ? `Familia ${lastName}` : "Chat Familiar";
  }


  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <AppShell user={user} onSignOut={handleSignOut}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
            {/* Family Chat */}
            <Card className="flex flex-col h-[400px]">
                <CardHeader>
                    <CardTitle>{getFamilyName()}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <div className="flex h-full flex-col">
                        <div className="flex-1 space-y-4 p-4 overflow-y-auto">
                            <div className="flex items-end gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="https://picsum.photos/seed/6/100/100" />
                                    <AvatarFallback>AR</AvatarFallback>
                                </Avatar>
                                <div className="max-w-xs rounded-lg bg-secondary p-3">
                                    <p className="text-sm">¿Hijo, ya vienes a casa a comer?</p>
                                </div>
                            </div>
                            <div className="flex items-end gap-2 justify-end">
                                <div className="max-w-xs rounded-lg bg-primary text-primary-foreground p-3">
                                    <p className="text-sm">¡Sí, mamá! Llego en 15 minutos.</p>
                                </div>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.photoURL || undefined} />
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
                </CardContent>
            </Card>

            {/* Family Alerts */}
             <Card>
                <CardHeader>
                    <CardTitle>Alertas Familiares</CardTitle>
                    <CardDescription>Alertas recientes enviadas por tus familiares.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
                    <AlertCircle className="mx-auto h-8 w-8"/>
                    <p>La funcionalidad de alertas familiares está en construcción.</p>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mapa Familiar</CardTitle>
                    <CardDescription>Visualiza la última ubicación conocida de tus familiares aceptados.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative h-64 w-full rounded-lg overflow-hidden">
                        <GoogleMap />
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

    