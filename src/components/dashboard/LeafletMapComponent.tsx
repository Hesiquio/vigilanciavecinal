
"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Manually import icon images to prevent build issues with Next.js
// This code runs once when the module is imported.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default icon path issue with Webpack
// This should be done only once, and it's done here at the module level.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src,
    iconUrl: markerIcon.src,
    shadowUrl: markerShadow.src,
});


type MarkerData = {
    lat: number;
    lng: number;
    label?: string;
};

type LeafletMapComponentProps = {
  center?: { lat: number; lng: number };
  markerPosition?: MarkerData;
  markers?: MarkerData[];
};

const LeafletMapComponent = ({ center, markerPosition, markers }: LeafletMapComponentProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // Cleanup previous map instance if it exists
        if (mapInstanceRef.current) {
            mapInstanceRef.current.off();
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const allMarkersData: MarkerData[] = [];
        if (markerPosition) allMarkersData.push(markerPosition);
        if (markers) allMarkersData.push(...markers);

        const initialCenter = center || (allMarkersData.length > 0 ? allMarkersData[0] : undefined) || { lat: 19.4326, lng: -99.1332 };

        const map = L.map(mapRef.current).setView([initialCenter.lat, initialCenter.lng], 15);
        mapInstanceRef.current = map;

        L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`, {
            attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        allMarkersData.forEach(pos => {
            if (pos) {
                // Use the default icon, which is now correctly configured at the module level.
                const marker = L.marker([pos.lat, pos.lng]).addTo(map);
                if (pos.label) {
                    marker.bindTooltip(pos.label, { permanent: true, direction: 'top', offset: [0, -15], className: 'map-label' }).openTooltip();
                }
            }
        });
        
        if (allMarkersData.length > 1) {
            const bounds = L.latLngBounds(allMarkersData.map(m => [m.lat, m.lng]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }


        // Cleanup function to destroy the map instance
        return () => {
            if (map) {
                map.off();
                map.remove();
                mapInstanceRef.current = null;
            }
        };

    }, [center, markerPosition, markers]); // Rerun effect if these props change

    return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMapComponent;
