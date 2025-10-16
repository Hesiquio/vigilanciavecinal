
"use client";

import { MapContainer, TileLayer, Marker, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default icon not showing in Leaflet. This must be done in a client component.
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
}


type MapProps = {
  center?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
  markers?: { lat: number; lng: number }[];
  polygon?: { lat: number, lng: number }[];
};

// This component is responsible for updating the map view when props change.
const MapUpdater = ({ center, markers, polygon, markerPosition }: MapProps) => {
    const map = useMap();
    useEffect(() => {
        const targetCenter = center || polygon?.[0] || markers?.[0] || markerPosition;
        if (targetCenter) {
             map.setView([targetCenter.lat, targetCenter.lng], map.getZoom() || 15);
        }
        
        if (polygon && polygon.length > 0) {
            const bounds = L.latLngBounds(polygon.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds);
        } else if (markers && markers.length > 1) {
            const bounds = L.latLngBounds(markers.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds);
        } else if (markerPosition) {
             map.setView([markerPosition.lat, markerPosition.lng], map.getZoom() || 15);
        }

    }, [center, markers, polygon, markerPosition, map]);
    return null;
}


const LeafletMapComponent = ({ center, markerPosition, markers, polygon }: MapProps) => {
    const defaultCenter: [number, number] = [19.4326, -99.1332]; // Mexico City
    
    const getInitialCenter = (): [number, number] => {
        if (center) return [center.lat, center.lng];
        if (markerPosition) return [markerPosition.lat, markerPosition.lng];
        if (markers && markers.length > 0) return [markers[0].lat, markers[0].lng];
        if (polygon && polygon.length > 0) return [polygon[0].lat, polygon[0].lng];
        return defaultCenter;
    }

    const initialCenter = getInitialCenter();
    
    return (
        <MapContainer center={initialCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
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

export default LeafletMapComponent;
