
"use client";

import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';

// Manually import icon images to prevent build issues with Next.js
// This should be done only once, at the module level.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default icon path issue with Webpack
// This resolves the "iconUrl not set" error.
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

    const allMarkersData = (markers || []).concat(markerPosition ? [markerPosition] : []);
    const initialCenter = center || (allMarkersData.length > 0 ? allMarkersData[0] : undefined) || { lat: 19.4326, lng: -99.1332 };

    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            const map = L.map(mapRef.current).setView(initialCenter, 15);
            mapInstanceRef.current = map;

            L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`, {
                attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
        }

        const map = mapInstanceRef.current;
        if (map) {
            // Clear existing markers
            map.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            // Add new markers
            allMarkersData.forEach(pos => {
                if (pos) {
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
            } else if (center) {
                map.setView([center.lat, center.lng], 15);
            }
        }

        // Cleanup function
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.off();
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };

    }, [center, markers, markerPosition, initialCenter, allMarkersData]);


    return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMapComponent;

    