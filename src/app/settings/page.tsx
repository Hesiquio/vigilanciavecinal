"use client";

import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import GoogleMap from "@/components/dashboard/GoogleMap";
import { useFirebase } from "@/firebase";

// Example coordinates for a neighborhood polygon
const neighborhoodPolygon = [
  { lat: 19.435, lng: -99.135 },
  { lat: 19.430, lng: -99.135 },
  { lat: 19.430, lng: -99.130 },
  { lat: 19.435, lng: -99.130 },
];

export default function SettingsPage() {
  const { user, isUserLoading, auth } = useFirebase();
  const router = useRouter();

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

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <AppShell user={user} onSignOut={handleSignOut} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-headline font-bold">Ajustes</h2>

          <Card>
            <CardHeader>
              <CardTitle>Mi Zona de Vigilancia</CardTitle>
              <CardDescription>
                Esta es el área geográfica que tu grupo de vigilancia cubre.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-64 w-full rounded-lg overflow-hidden">
                 <GoogleMap polygon={neighborhoodPolygon} />
              </div>
               <Button variant="outline" className="mt-4 w-full">Editar Zona</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Administra tu información personal y de contacto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
                  <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button variant="outline">Cambiar Foto</Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" defaultValue={user.displayName || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" defaultValue={user.phoneNumber || "+52 55 8765 4321"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Elige qué alertas quieres recibir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="sos-alerts">Alertas de Auxilio (SOS)</Label>
                  <p className="text-sm text-muted-foreground">Notificaciones urgentes de tus vecinos.</p>
                </div>
                <Switch id="sos-alerts" defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="chat-messages">Mensajes del Chat</Label>
                   <p className="text-sm text-muted-foreground">Nuevos mensajes en el chat de la colonia.</p>
                </div>
                <Switch id="chat-messages" defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="family-alerts">Alertas Familiares</Label>
                  <p className="text-sm text-muted-foreground">Notificaciones de geocerca para tu familia.</p>
                </div>
                <Switch id="family-alerts" defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <Button variant="destructive" className="w-full" onClick={handleSignOut}>
            Cerrar Sesión
          </Button>
        </div>
      </main>
    </div>
  );
}
