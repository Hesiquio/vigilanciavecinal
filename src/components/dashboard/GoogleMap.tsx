
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin } from "lucide-react";

// Fix for default icon not showing in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


type MapProps = {
  center?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
  markers?: { lat: number; lng: number }[];
  polygon?: { lat: number, lng: number }[];
};

const MapUpdater = ({ center, markers, polygon, markerPosition }: MapProps) => {
    const map = useMap();
    useEffect(() => {
        const targetCenter = center || polygon?.[0] || markers?.[0] || markerPosition;
        if (targetCenter) {
             map.setView([targetCenter.lat, targetCenter.lng], 15);
        }
        if (polygon && polygon.length > 0) {
            const bounds = L.latLngBounds(polygon.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds);
        }

    }, [center, markers, polygon, markerPosition, map]);
    return null;
}

const LeafletMap = ({ center, markerPosition, markers, polygon }: MapProps) => {
    const defaultCenter: [number, number] = [19.4326, -99.1332]; // Mexico City
    const displayCenter = center ? [center.lat, center.lng] : (polygon?.[0] ? [polygon[0].lat, polygon[0].lng] : (markers?.[0] ? [markers[0].lat, markers[0].lng] : (markerPosition ? [markerPosition.lat, markerPosition.lng] : defaultCenter)));
    
    return (
        <MapContainer center={displayCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {markerPosition && <Marker position={[markerPosition.lat, markerPosition.lng]} />}
            {markers?.map((pos, i) => <Marker key={i} position={[pos.lat, pos.lng]} />)}
            {polygon && polygon.length > 0 && (
                 <Polygon pathOptions={{ color: 'hsl(var(--primary))' }} positions={polygon.map(p => [p.lat, p.lng])} />
            )}
            <MapUpdater center={center} markers={markers} polygon={polygon} markerPosition={markerPosition} />
        </MapContainer>
    );
};

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
  // A client component can't be async, so we need to wrap the dynamic import
  // in a component that can use state and effects.
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show a placeholder or loader while the component is not yet mounted on the client
  if (!isClient) {
    return <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center"><p>Cargando mapa...</p></div>;
  }
  
  const hasLocation = props.center || props.markerPosition || (props.markers && props.markers.length > 0) || (props.polygon && props.polygon.length > 0);

  if (!hasLocation) {
      return <MissingLocationCard />;
  }

  return <LeafletMap {...props} />;
}
