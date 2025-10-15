
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Loader, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, writeBatch, doc } from "firebase/firestore";
import type { UserGroup } from "@/types";

export default function GroupsPage() {
  const { user, isUserLoading, auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const userGroupsQuery = useMemoFirebase(
    () => (user && firestore ? collection(firestore, `users/${user.uid}/groups`) : null),
    [user, firestore]
  );
  const { data: userGroups, isLoading: isLoadingGroups } = useCollection<UserGroup>(userGroupsQuery);

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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !firestore || !user) {
      toast({ title: "Error", description: "El nombre del grupo no puede estar vacío.", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
        const batch = writeBatch(firestore);

        // 1. Create the group document in the main 'groups' collection
        const newGroupRef = doc(collection(firestore, "groups"));
        batch.set(newGroupRef, {
            name: newGroupName,
            ownerId: user.uid,
        });

        // 2. Add the group to the user's subcollection of groups
        const userGroupRef = doc(firestore, `users/${user.uid}/groups`, newGroupRef.id);
        batch.set(userGroupRef, {
            name: newGroupName,
        });

        // 3. Add the creator as the first accepted member of the group
        const groupMemberRef = doc(firestore, `groups/${newGroupRef.id}/members`, user.uid);
        batch.set(groupMemberRef, {
            userId: user.uid,
            name: user.displayName || user.email,
            email: user.email,
            avatarUrl: user.photoURL,
            status: 'accepted',
        });

        await batch.commit();

        toast({ title: "Grupo Creado", description: `El grupo "${newGroupName}" ha sido creado.` });
        setNewGroupName("");
        setIsCreateDialogOpen(false);
        router.push(`/groups/${newGroupRef.id}`);
    } catch (error) {
        console.error("Error creating group:", error);
        toast({ title: "Error", description: "No se pudo crear el grupo.", variant: "destructive" });
    }
    setIsCreating(false);
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
       <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Mis Grupos</CardTitle>
                    <CardDescription>Crea o únete a grupos de chat personalizados.</CardDescription>
                </div>
                 <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Grupo
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoadingGroups ? (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="mt-4 text-sm text-muted-foreground">Cargando tus grupos...</p>
                    </div>
                ) : userGroups && userGroups.length > 0 ? (
                     userGroups.map((group) => (
                        <Link href={`/groups/${group.id}`} key={group.id} passHref>
                           <Button variant="outline" className="w-full justify-between h-20 p-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-secondary p-3 rounded-lg">
                                        <Users className="h-6 w-6 text-secondary-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold">{group.name}</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </Link>
                     ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center p-4">
                        <Users className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-sm text-muted-foreground">Aún no perteneces a ningún grupo.</p>
                        <p className="text-xs text-muted-foreground">¡Crea uno para empezar a colaborar!</p>
                    </div>
                )}
            </CardContent>
        </Card>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                    <DialogDescription>
                        Dale un nombre a tu nuevo grupo para empezar a invitar miembros.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="group-name">Nombre del Grupo</Label>
                        <Input
                            id="group-name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Ej. Corredores Nocturnos"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateGroup} disabled={isCreating}>
                        {isCreating ? <Loader className="animate-spin" /> : "Crear y Continuar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </AppShell>
  );
}

