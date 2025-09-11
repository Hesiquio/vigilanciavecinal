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
import { currentUser } from "@/lib/data";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <h2 className="text-2xl font-headline font-bold">Ajustes</h2>

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
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button variant="outline">Cambiar Foto</Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" defaultValue={currentUser.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" defaultValue="+52 55 8765 4321" />
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
        
        <Button variant="destructive" className="w-full">
          Cerrar Sesión
        </Button>
      </div>
    </AppShell>
  );
}
