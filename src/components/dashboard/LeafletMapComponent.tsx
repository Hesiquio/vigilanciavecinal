
"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Manually import icon images to prevent build issues with Next.js
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// This is the correct way to fix the icon path issue.
// It should be done only once, at the module level.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src,
    iconUrl: markerIcon.src,
    shadowUrl: markerShadow.src,
});


type MarkerData = {
    lat: number;
    lng: number;
};

type LeafletMapComponentProps = {
  center?: { lat: number; lng: number };
  markerPosition?: MarkerData;
  markers?: MarkerData[];
};

const LeafletMapComponent = ({ center, markerPosition, markers }: LeafletMapComponentProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    const allMarkersData = (markers || []).concat(markerPosition ? [markerPosition] : []);
    const initialCenter = center || (allMarkersData.length > 0 ? allMarkersData[0] : undefined) || { lat: 19.4326, lng: -99.1332 };

    useEffect(() => {
        // Cleanup previous map instance if it exists
        if (mapInstanceRef.current) {
            mapInstanceRef.current.off();
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        if (mapRef.current) { // Check if the ref is attached
            const map = L.map(mapRef.current).setView(initialCenter, 15);
            mapInstanceRef.current = map;

            L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`, {
                attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
            
            // Add new markers
            allMarkersData.forEach(pos => {
              if (pos) {
                L.marker([pos.lat, pos.lng]).addTo(map);
              }
            });

             if (allMarkersData.length > 1) {
                const bounds = L.latLngBounds(allMarkersData.map(m => [m.lat, m.lng]));
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } else if (center) {
                map.setView([center.lat, center.lng], 15);
            }
        }

        // The cleanup function for when the component unmounts or deps change
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.off();
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };

    }, [center, markers, markerPosition]); // Re-run effect if these props change


    return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMapComponent;
