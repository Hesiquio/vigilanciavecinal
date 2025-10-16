
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader, MapPin, CheckCircle, LogOut } from "lucide-react";
import type { UserProfile } from "@/types";

export default function WelcomePage() {
  const { user, isUserLoading, firestore, auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [postalCode, setPostalCode] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationString, setLocationString] = useState("Ubicación no obtenida");
  const [isSaving, setIsSaving] = useState(false);

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, "users", user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // Pre-fill data from user profile
  useEffect(() => {
    if (userProfile) {
      if (userProfile.postalCode) {
        setPostalCode(userProfile.postalCode);
      }
      if (userProfile.location) {
        setLocationString(userProfile.location);
        setLocationStatus("success");
      }
    }
  }, [userProfile]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus("loading");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationString(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
          setLocationStatus("success");
          toast({
            title: "Ubicación Obtenida",
            description: "Tu ubicación se ha registrado correctamente.",
          });
        },
        () => {
          setLocationStatus("error");
          setLocationString("No se pudo obtener la ubicación");
          toast({
            title: "Error de Ubicación",
            description: "No pudimos obtener tu ubicación. Asegúrate de tener los permisos activados.",
            variant: "destructive",
          });
        }
      );
    } else {
      setLocationStatus("error");
      setLocationString("Geolocalización no soportada");
    }
  };

  const handleContinue = async () => {
    if (locationStatus !== "success") {
      toast({
        title: "Ubicación Requerida",
        description: "Por favor, comparte tu ubicación para continuar.",
        variant: "destructive",
      });
      return;
    }
    if (!postalCode) {
      toast({
        title: "Código Postal Requerido",
        description: "Por favor, ingresa tu código postal.",
        variant: "destructive",
      });
      return;
    }

    if (user && firestore) {
      setIsSaving(true);
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        await setDoc(userDocRef, { 
            postalCode: postalCode, 
            location: locationString,
            verificationTimestamp: serverTimestamp(),
            // also ensure name, email, avatar are set from the auth user if not present
            name: userProfile?.name || user.displayName,
            email: userProfile?.email || user.email,
            avatarUrl: userProfile?.avatarUrl || user.photoURL,
        }, { merge: true });
        toast({
          title: "Perfil Actualizado",
          description: "Tu información ha sido guardada.",
        });
        router.push("/"); // Redirect to dashboard
      } catch (error) {
        console.error("Error saving profile:", error);
        toast({ title: "Error", description: "No se pudo guardar tu información.", variant: "destructive" });
        setIsSaving(false);
      }
    }
  };

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/login");
    }
  };

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Verificación de Zona</h1>
            <p className="text-muted-foreground">Necesitamos confirmar tu ubicación para asignarte a tu grupo vecinal.</p>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Paso 1: Comparte tu ubicación</Label>
                <div className="flex items-center gap-2">
                    <Button onClick={handleGetLocation} disabled={locationStatus === 'loading'} className="flex-1">
                        <MapPin className="mr-2 h-4 w-4" />
                        {locationStatus === 'loading' ? "Obteniendo..." : "Obtener mi Ubicación"}
                    </Button>
                    {locationStatus === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
                    {locationStatus === 'loading' && <Loader className="h-6 w-6 animate-spin" />}
                </div>
                 <p className="text-xs text-muted-foreground text-center">{locationString}</p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="postalCode">Paso 2: Ingresa tu Código Postal</Label>
                <Input
                    id="postalCode"
                    placeholder="Tu código postal"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    />
            </div>
        </div>
        
        <div className="space-y-2">
            <Button onClick={handleContinue} className="w-full" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Verificar y Continuar"}
            </Button>
             <Button variant="link" onClick={handleSignOut} className="w-full text-muted-foreground">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
            </Button>
        </div>
      </div>
    </div>
  );
}
