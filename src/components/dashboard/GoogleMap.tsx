
"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin } from "lucide-react";

type MapProps = {
  center?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
  markers?: { lat: number; lng: number }[];
  polygon?: { lat: number, lng: number }[];
};

// Dynamically import the map component to prevent SSR issues
const LeafletMap = dynamic(() => import('./LeafletMapComponent'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center"><p>Cargando mapa...</p></div>,
});


const MissingLocationCard = () => (
    <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center p-4">
        <Alert>
            <MapPin className="h-4 w-4" />
            <AlertTitle>Ubicación no disponible</AlertTitle>
            <AlertDescription>
                No hay una ubicación o zona para mostrar en el mapa.
            </AlertDescription>
        </Alert>
    </div>
);


export default function MapWrapper(props: MapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center"><p>Cargando mapa...</p></div>;
  }
  
  const hasLocation = props.center || props.markerPosition || (props.markers && props.markers.length > 0) || (props.polygon && props.polygon.length > 0);

  if (!hasLocation) {
      return <MissingLocationCard />;
  }

  return <LeafletMap {...props} />;
}
