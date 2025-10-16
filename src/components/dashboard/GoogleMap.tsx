
"use client";

import { APIProvider, Map, useMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin } from "lucide-react";

type GoogleMapProps = {
  center?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
  markers?: { lat: number; lng: number }[];
  polygon?: { lat: number, lng: number }[];
};


const MapWithPolygon = ({ polygon }: { polygon?: { lat: number, lng: number }[]}) => {
  const map = useMap();

  useEffect(() => {
    if (map && polygon) {
      const polygonPath = new google.maps.Polygon({
        paths: polygon,
        strokeColor: "hsl(var(--primary))",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "hsl(var(--primary))",
        fillOpacity: 0.35,
      });
      polygonPath.setMap(map);
      
      return () => {
        polygonPath.setMap(null);
      }
    }
  }, [map, polygon]);

  return null;
}

const MissingApiKeyCard = () => (
    <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
            <MapPin className="h-4 w-4" />
            <AlertTitle>Error al Cargar el Mapa</AlertTitle>
            <AlertDescription>
                La clave de API de Google Maps no está configurada o el proyecto no tiene la facturación habilitada. Por favor, revisa tu configuración en Google Cloud.
            </AlertDescription>
        </Alert>
    </div>
);


export default function GoogleMap({ center, markerPosition, markers, polygon }: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <MissingApiKeyCard />;
  }

  const mapCenter = center || polygon?.[0] || markers?.[0] || markerPosition || { lat: 19.4326, lng: -99.1332 };

  return (
    <APIProvider apiKey={apiKey} >
      <Map
        center={mapCenter}
        defaultZoom={15}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        mapId="b1b2f2c2a3e4f5a6"
      >
        {markerPosition && <AdvancedMarker position={markerPosition} />}
        {markers && markers.map((pos, i) => <AdvancedMarker key={i} position={pos} />)}
        {polygon && <MapWithPolygon polygon={polygon} />}
      </Map>
    </APIProvider>
  );
}
