
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
import GoogleMapWrapper from "@/components/dashboard/GoogleMap";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/types";
import { Loader, MapPin } from "lucide-react";


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
  const [location, setLocation] = useState("");
  const [isLocationLoading, setIsLocationLoading] = useState(false);

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
      setLocation(userProfile.location || "Ubicación no establecida");
      if (userProfile.location) {
        const coords = parseLocation(userProfile.location);
        setMapCenter(coords || undefined);
        setMapLoading(!coords);
      } else {
        setMapLoading(false);
      }
    } else if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [userProfile, user]);

  const handleUpdateLocation = () => {
    if (navigator.geolocation) {
      setIsLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
          setLocation(newLocation);
          setMapCenter({ lat: latitude, lng: longitude });
          setIsLocationLoading(false);
          toast({
            title: "Ubicación Actualizada",
            description: "Tu ubicación se ha actualizado. No olvides guardar tu perfil.",
          });
        },
        () => {
          setIsLocationLoading(false);
          toast({
            title: "Error de Ubicación",
            description: "No pudimos obtener tu ubicación. Asegúrate de tener los permisos activados.",
            variant: "destructive",
          });
        }
      );
    } else {
       toast({
        title: "Error",
        description: "Tu navegador no soporta geolocalización.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/login");
    }
  };
  
  const parseLocation = (locationStr: string): { lat: number; lng: number } | null => {
      const match = locationStr.match(/Lat: ([-]?\d+\.\d+), Lon: ([-]?\d+\.\d+)/);
      if (match && match.length === 3) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
      return { lat: 19.4326, lng: -99.1332 };
  }

  const handleProfileSave = async () => {
    if (!userDocRef) {
      toast({ title: "Error", description: "No se puede guardar el perfil.", variant: "destructive" });
      return;
    }

    try {
      const profileData: Partial<UserProfile> = {
        name: displayName,
        email: user?.email,
        avatarUrl: user?.photoURL || '',
        postalCode: postalCode,
        location: location,
      };

      await setDoc(userDocRef, profileData, { merge: true });
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
             <div className="space-y-2">
              <Label htmlFor="location">Ubicación Guardada</Label>
               <div className="flex items-center gap-2">
                <Input id="location" value={location} readOnly className="text-muted-foreground"/>
                <Button onClick={handleUpdateLocation} variant="outline" disabled={isLocationLoading}>
                  {isLocationLoading ? <Loader className="h-4 w-4 animate-spin"/> : <MapPin className="h-4 w-4"/>}
                </Button>
               </div>
            </div>
            <Button onClick={handleProfileSave}>Guardar Perfil</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mi Zona de Vigilancia</CardTitle>
            <CardDescription>
              Esta es el área geográfica que cubre tu grupo de vigilancia, centrada en tu última ubicación guardada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {mapLoading ? (
              <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                <p>Cargando mapa...</p>
              </div>
            ) : (
              <div className="relative h-96 w-full rounded-lg overflow-hidden">
                <GoogleMapWrapper center={mapCenter} markerPosition={mapCenter} />
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
