

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, MessageCircle, ShieldAlert, Siren, CloudSunRain, UserX, Megaphone } from "lucide-react";
import type { SosAlert, AlertCategory } from "../AppShell";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import dynamic from 'next/dynamic';
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/types";

const GoogleMapComponent = dynamic(() => import('@/components/dashboard/GoogleMapComponent'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center"><p>Cargando mapa...</p></div>,
});


type AlertCardProps = {
  alert: SosAlert;
};

// Basic parsing of "Lat: 19.4326, Lon: -99.1332"
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

const formatTimestamp = (timestamp: SosAlert['timestamp']): string => {
  if (!timestamp) return 'Ahora mismo';
  const date = new Date(timestamp.seconds * 1000);
  return `hace ${formatDistanceToNow(date, { locale: es })}`;
}

const categoryIcons: Record<AlertCategory, React.ElementType> = {
    "Robo": ShieldAlert,
    "Accidentes": Siren,
    "Desastres Naturales": CloudSunRain,
    "Personas Sospechosas": UserX,
}

const categoryColors: Record<AlertCategory, string> = {
    "Robo": "border-red-500/50 text-red-500",
    "Accidentes": "border-orange-500/50 text-orange-500",
    "Desastres Naturales": "border-blue-500/50 text-blue-500",
    "Personas Sospechosas": "border-yellow-500/50 text-yellow-500",
}


export function AlertCard({ alert }: AlertCardProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isNotifying, setIsNotifying] = useState(false);

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, "users", user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);


  const markerPosition = parseLocation(alert.location);
  const markers = markerPosition ? [markerPosition] : [];

  const Icon = categoryIcons[alert.category] || ShieldAlert;
  const colorClass = categoryColors[alert.category] || "border-destructive/50 text-destructive";

  const handleNotifyNeighbors = async () => {
    if (!firestore || !user || !userProfile || !userProfile.postalCode) {
        toast({ title: "Error", description: "No se puede notificar: perfil de usuario incompleto.", variant: "destructive" });
        return;
    }
    setIsNotifying(true);

    const title = `Atención a la alerta de ${alert.category}`;
    const description = `Se ha reportado una alerta de '${alert.category}' en la zona. Mensaje original: "${alert.message}". Por favor, manténgase alerta.`;
    const audience = ['neighbors']; // Only notify user's own neighbors

    try {
        const avisosCollection = collection(firestore, 'avisos');
        
        // Correctly create a Firestore Timestamp from the alert's timestamp
        const eventTimestamp = new Timestamp(alert.timestamp.seconds, alert.timestamp.nanoseconds);

        const newAvisoData = {
            userId: user.uid,
            userName: user.displayName || "Usuario Anónimo",
            userAvatarUrl: user.photoURL || "",
            title,
            description,
            eventTimestamp: eventTimestamp, 
            audience,
            timestamp: serverTimestamp(),
        };

        await addDoc(avisosCollection, newAvisoData);
        
        // Post system message to the neighborhood chat
        const neighborhoodChatRef = collection(firestore, `neighborhood-chats/${userProfile.postalCode}/messages`);
        await addDoc(neighborhoodChatRef, {
            text: `**AVISO (desde alerta): ${title}**\n${description}`,
            userId: 'system',
            userName: 'Sistema de Avisos',
            userAvatarUrl: '',
            timestamp: serverTimestamp(),
        });

        toast({
            title: "Vecinos Notificados",
            description: "Se ha enviado un aviso a tu chat vecinal.",
        });

    } catch (error) {
        console.error("Error notifying neighbors:", error);
        toast({ title: "Error", description: "No se pudo enviar la notificación a los vecinos.", variant: "destructive" });
    } finally {
        setIsNotifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <Avatar className={cn("h-12 w-12 border-2", colorClass)}>
          <AvatarImage src={alert.userAvatarUrl} alt={alert.userName} />
          <AvatarFallback>{alert.userName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-bold text-foreground">{alert.userName}</p>
            <p className="text-xs text-muted-foreground">{formatTimestamp(alert.timestamp)}</p>
          </div>
           <div className={cn("mt-1 flex items-center gap-2 text-sm font-semibold", colorClass)}>
                <Icon className="h-4 w-4" />
                <span>{alert.category}</span>
            </div>
          <p className="mt-1 text-sm text-foreground">{alert.message}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{alert.location}</span>
          </div>
        </div>
      </div>
      <div className="relative h-48 w-full rounded-lg overflow-hidden">
        <GoogleMapComponent markers={markers} center={markerPosition || undefined} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" disabled>
          <MessageCircle className="mr-2 h-4 w-4" /> Responder
        </Button>
        <Button onClick={handleNotifyNeighbors} disabled={isNotifying}>
            <Megaphone className="mr-2 h-4 w-4" />
            {isNotifying ? 'Notificando...' : 'Notificar a Vecinos'}
        </Button>
      </div>
    </div>
  );
}
