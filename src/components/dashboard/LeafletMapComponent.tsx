
"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configuración de iconos por defecto de Leaflet para que funcione con Next.js
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src,
    iconUrl: markerIcon.src,
    shadowUrl: markerShadow.src,
});


type LeafletMapComponentProps = {
  center?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number }; // A single marker for simplicity
};

const LeafletMapComponent = ({ center, markerPosition }: LeafletMapComponentProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    const initialCenter = center || markerPosition || { lat: 19.4326, lng: -99.1332 };

    useEffect(() => {
        // Cleanup previous map instance if it exists
        if (mapInstanceRef.current) {
            mapInstanceRef.current.off();
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        if (mapRef.current) {
            const map = L.map(mapRef.current).setView(initialCenter, 15);
            mapInstanceRef.current = map;

            L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`, {
                attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
            
            if (markerPosition && typeof markerPosition.lat === 'number' && typeof markerPosition.lng === 'number') {
                L.marker([markerPosition.lat, markerPosition.lng]).addTo(map);
            }
             if (center) {
                map.setView([center.lat, center.lng], 15);
            }
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.off();
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [center, markerPosition]);


    return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMapComponent;
