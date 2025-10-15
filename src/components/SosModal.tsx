
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Siren, Mic, Video, MapPin, Send, MessageCircle, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";
import { useFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type SosModalProps = {
    user: User;
}

const alertCategories = [
    "Robo",
    "Accidentes",
    "Desastres Naturales",
    "Personas Sospechosas",
]

export function SosModal({ user }: SosModalProps) {
  const { firestore } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("Ubicación no disponible");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setLocation("Obteniendo ubicación...");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
          },
          () => {
            setLocation("No se pudo obtener la ubicación.");
            toast({
                title: "Error de Ubicación",
                description: "No se pudo obtener la ubicación. Por favor, ingrésala manualmente.",
                variant: "destructive"
            })
          }
        );
      } else {
        setLocation("Geolocalización no soportada.");
      }
    }
  }, [isOpen, toast]);

  const handleSendSos = () => {
    if (!category) {
        toast({
            title: "Categoría Requerida",
            description: "Por favor, selecciona una categoría para la alerta.",
            variant: "destructive",
        });
        return;
    }
     if (message.trim() === "") {
        toast({
            title: "Mensaje Requerido",
            description: "Por favor, describe la emergencia antes de enviar la alerta.",
            variant: "destructive",
        });
        return;
    }
    
    if (!firestore) {
        toast({ title: "Error", description: "La base de datos no está disponible.", variant: "destructive" });
        return;
    }

    const alertsCollection = collection(firestore, 'sos-alerts');
    const newAlert = {
        userId: user.uid,
        userName: user.displayName || "Usuario Anónimo",
        userAvatarUrl: user.photoURL || "",
        message,
        location,
        category,
        timestamp: serverTimestamp(),
    };

    addDocumentNonBlocking(alertsCollection, newAlert);
    
    toast({
        title: "¡Alerta de Auxilio Enviada!",
        description: "Tu grupo ha sido notificado y tu ubicación compartida.",
    });
    setIsOpen(false);
    setMessage("");
    setCategory("");
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="destructive"
        className="fixed bottom-20 right-4 z-20 h-16 w-16 rounded-full shadow-2xl animate-pulse md:bottom-6 md:right-6"
        aria-label="Enviar Alerta de Auxilio"
      >
        <Siren className="h-8 w-8" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-headline text-destructive">
              <Siren className="h-6 w-6" />
              Reportar Incidencia
            </DialogTitle>
            <DialogDescription>
              Tu ubicación actual será compartida con tu grupo de vigilancia vecinal. Describe la emergencia para que sea validada por el grupo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="relative">
                <ShieldAlert className="absolute top-3 left-3 h-4 w-4 text-primary" />
                 <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="pl-9">
                        <SelectValue placeholder="Selecciona una categoría..." />
                    </SelectTrigger>
                    <SelectContent>
                        {alertCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="relative">
                <MapPin className="absolute top-3 left-3 h-4 w-4 text-primary" />
                <Input 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Escribe la ubicación..."
                    className="pl-9"
                />
            </div>
            <div className="relative">
              <Textarea
                placeholder="Describe la incidencia (ej. persona sospechosa, vehículo desconocido, actividad inusual, etc.)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] pr-10"
              />
              <MessageCircle className="absolute top-3 right-3 h-5 w-5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="flex items-center justify-center gap-2">
                    <Mic className="h-4 w-4" /> Grabar Audio
                </Button>
                <Button variant="outline" className="flex items-center justify-center gap-2">
                    <Video className="h-4 w-4" /> Grabar Video
                </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleSendSos} className="flex-1">
              <Send className="mr-2 h-4 w-4" />
              Enviar Alerta al Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
