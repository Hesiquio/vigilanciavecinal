
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader, MapPin, CheckCircle } from "lucide-react";

export default function WelcomePage() {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [postalCode, setPostalCode] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationString, setLocationString] = useState("Ubicación no obtenida");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

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

    // TODO: Implement verification logic here.
    // 1. Use a geocoding API to get postal code from lat/lng.
    // 2. Compare it with the user-entered postalCode.
    // 3. If they don't match, show an error toast.
    console.log("Verificación de ubicación/código postal pendiente de implementación.");


    if (user && firestore) {
      setIsSaving(true);
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        await setDoc(userDocRef, { postalCode: postalCode }, { merge: true });
        toast({
          title: "Perfil Actualizado",
          description: "Tu código postal ha sido guardado.",
        });
        router.push("/"); // Redirect to dashboard
      } catch (error) {
        console.error("Error saving postal code:", error);
        toast({ title: "Error", description: "No se pudo guardar tu código postal.", variant: "destructive" });
        setIsSaving(false);
      }
    }
  };

  if (isUserLoading || !user) {
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
        
        <Button onClick={handleContinue} className="w-full" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Verificar y Continuar"}
        </Button>
      </div>
    </div>
  );
}
