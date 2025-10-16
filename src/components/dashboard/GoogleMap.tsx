
"use client";

import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin } from "lucide-react";

type MapProps = {
  center?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
  markers?: { lat: number; lng: number }[];
  polygon?: { lat: number, lng: number }[];
};

// This is the actual client component that renders the map.
// It receives the apiKey as a prop.
function GoogleMapClient({ 
  apiKey, 
  center, 
  markerPosition, 
  markers, 
  polygon 
}: MapProps & { apiKey: string }) {

  const mapCenter = center || polygon?.[0] || markers?.[0] || markerPosition || { lat: 19.4326, lng: -99.1332 };

  return (
    <APIProvider apiKey={apiKey}>
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


// --- Helper components ---

const MapWithPolygon = ({ polygon }: { polygon?: { lat: number, lng: number }[]}) => {
  const map = useMap();

  useEffect(() => {
    if (map && polygon && polygon.length > 0) {
      const polygonPath = new google.maps.Polygon({
        paths: polygon,
        strokeColor: "hsl(var(--primary))",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "hsl(var(--primary))",
        fillOpacity: 0.35,
      });
      polygonPath.setMap(map);
      
      const bounds = new google.maps.LatLngBounds();
      polygon.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);

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
            <AlertTitle>Error: Fallo de Autenticación del Mapa</AlertTitle>
            <AlertDescription>
                La clave de API de Google Maps no es válida, está mal configurada o faltan permisos.
                <ul className="list-disc pl-5 mt-2 text-xs">
                    <li><b>Verifica la Clave:</b> Asegúrate de que la clave en tu archivo <code>.env</code> para <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> sea correcta.</li>
                    <li><b>API Habilitada:</b> Confirma que la "Maps JavaScript API" esté habilitada en tu proyecto de Google Cloud.</li>
                    <li><b>Restricciones HTTP:</b> Revisa que las "Restricciones de aplicación" (Referentes HTTP) en tu clave de API permitan el dominio donde ejecutas la app (incluyendo <code>localhost</code> para desarrollo). Este es el error más común (ApiTargetBlockedMapError).</li>
                    <li><b>Facturación Habilitada:</b> Confirma que tu proyecto de Google Cloud tenga la facturación habilitada.</li>
                </ul>
            </AlertDescription>
        </Alert>
    </div>
);


// This is the server component wrapper that will be exported and used in the app.
// It reads the API key from the environment and passes it to the client component.
export default function GoogleMapWrapper(props: MapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <MissingApiKeyCard />;
  }

  return <GoogleMapClient apiKey={apiKey} {...props} />;
}
