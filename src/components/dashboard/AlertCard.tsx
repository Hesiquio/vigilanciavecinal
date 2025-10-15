"use client";

import type { SosAlert } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, MessageCircle } from "lucide-react";
import GoogleMap from "./GoogleMap";

type AlertCardProps = {
  alert: SosAlert;
};

// Basic parsing of "Lat: 19.4326, Lon: -99.1332"
const parseLocation = (locationStr: string): { lat: number; lng: number } | null => {
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


export function AlertCard({ alert }: AlertCardProps) {
  const markerPosition = parseLocation(alert.location);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 border-2 border-destructive">
          <AvatarImage src={alert.user.avatarUrl} alt={alert.user.name} />
          <AvatarFallback>{alert.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-bold text-foreground">{alert.user.name}</p>
            <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
          </div>
          <p className="text-sm text-foreground">{alert.message}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{alert.location}</span>
          </div>
        </div>
      </div>
      <div className="relative h-48 w-full rounded-lg overflow-hidden">
        <GoogleMap markerPosition={markerPosition ?? undefined} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline">
          <MessageCircle className="mr-2 h-4 w-4" /> Responder
        </Button>
        <Button>
          <Phone className="mr-2 h-4 w-4" /> Llamar al Grupo
        </Button>
      </div>
    </div>
  );
}
