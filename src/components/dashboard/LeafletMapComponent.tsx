"use client";

import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect } from 'react';

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

// This component updates the map view when props change.
const MapUpdater = ({ center, markers, markerPosition }: LeafletMapComponentProps) => {
    const map = useMap();

    useEffect(() => {
        const allMarkers = (markers || []).concat(markerPosition ? [markerPosition] : []);
        
        if (allMarkers.length > 1) {
            const bounds = L.latLngBounds(allMarkers.map(m => [m.lat, m.lng]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        } else if (center) {
            map.setView([center.lat, center.lng], 15);
        }
    }, [center, markers, markerPosition, map]);

    return null; // This component does not render anything.
};


const LeafletMapComponent = ({ center, markerPosition, markers }: LeafletMapComponentProps) => {
    const allMarkersData = (markers || []).concat(markerPosition ? [markerPosition] : []);
    const initialCenter = center || (allMarkersData.length > 0 ? allMarkersData[0] : undefined) || { lat: 19.4326, lng: -99.1332 };

    return (
        <MapContainer center={initialCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapUpdater center={center} markers={markers} markerPosition={markerPosition} />

            {allMarkersData.map((pos, index) => (
                pos ? (
                    <Marker key={index} position={[pos.lat, pos.lng]}>
                        {pos.label && (
                             <Tooltip permanent direction="top" offset={[0, -15]} className="map-label">
                                {pos.label}
                            </Tooltip>
                        )}
                    </Marker>
                ) : null
            ))}
        </MapContainer>
    );
};

export default LeafletMapComponent;
