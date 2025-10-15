
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleMap from "@/components/dashboard/GoogleMap";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/types";


export default function SettingsPage() {
  const { user, isUserLoading, auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, "users", user.uid) : null),
    [user, firestore]
  );

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const [displayName, setDisplayName] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);
  
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.name || user?.displayName || "");
      setPostalCode(userProfile.postalCode || "");
    } else if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [userProfile, user]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setMapLoading(false);
        },
        () => {
          setMapCenter({ lat: 19.4326, lng: -99.1332 });
          setMapLoading(false);
        }
      );
    } else {
      setMapCenter({ lat: 19.4326, lng: -99.1332 });
      setMapLoading(false);
    }
  }, []);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/login");
    }
  };

  const handleProfileSave = async () => {
    if (!userDocRef) {
      toast({ title: "Error", description: "No se puede guardar el perfil.", variant: "destructive" });
      return;
    }

    try {
      await setDoc(userDocRef, {
        name: displayName,
        email: user?.email,
        avatarUrl: user?.photoURL,
        postalCode: postalCode,
      }, { merge: true });
      toast({ title: "Perfil Actualizado", description: "Tu información ha sido guardada." });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Error", description: "No se pudo guardar tu perfil.", variant: "destructive" });
    }
  };
  
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <AppShell user={user} onSignOut={handleSignOut}>
       <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mi Perfil</CardTitle>
            <CardDescription>
              Actualiza tu información personal. Tu código postal se usará para agruparte con tus vecinos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Ej. 06010" />
            </div>
            <Button onClick={handleProfileSave}>Guardar Perfil</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mi Zona de Vigilancia</CardTitle>
            <CardDescription>
              Esta es el área geográfica que cubre tu grupo de vigilancia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {mapLoading ? (
              <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                <p>Cargando mapa...</p>
              </div>
            ) : (
              <div className="relative h-96 w-full rounded-lg overflow-hidden">
                <GoogleMap center={mapCenter} />
              </div>
            )}
            <Button disabled>
              Editar Zona (Próximamente)
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

