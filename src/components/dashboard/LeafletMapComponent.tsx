"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import marker images and set them up once per module load
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

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
  markers?: MarkerData[];
};

const LeafletMapComponent = ({ center, markers = [] }: LeafletMapComponentProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);

    useEffect(() => {
        if (mapContainerRef.current) {
            // Clean up previous map instance if it exists
            if (mapRef.current) {
                mapRef.current.off();
                mapRef.current.remove();
            }

            const initialCenter = center || (markers && markers.length > 0 && markers[0]) || { lat: 19.4326, lng: -99.1332 };

            const map = L.map(mapContainerRef.current).setView([initialCenter.lat, initialCenter.lng], 15);
            mapRef.current = map;

            L.tileLayer(
                `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
                {
                    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                }
            ).addTo(map);

            // Clear previous markers from the ref array
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            const validMarkers = markers.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number');

            validMarkers.forEach(pos => {
                const marker = L.marker([pos.lat, pos.lng]).addTo(map);
                if (pos.label) {
                    marker.bindTooltip(pos.label, { permanent: true, direction: 'top', offset: [0, -15], className: 'map-label' }).openTooltip();
                }
                markersRef.current.push(marker);
            });
            
            if (validMarkers.length > 1) {
                const bounds = L.latLngBounds(validMarkers.map(m => [m.lat, m.lng]));
                map.fitBounds(bounds, { padding: [50, 50] });
            } else if (center) {
                 map.setView([center.lat, center.lng]);
            }
        }
        
        // Cleanup function to remove the map
        return () => {
            if (mapRef.current) {
                mapRef.current.off();
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [center, markers]); // Re-run effect if center or markers change

    return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMapComponent;
