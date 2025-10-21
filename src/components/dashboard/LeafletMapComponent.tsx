"use client";

import React from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// FIX: Import marker images and set them up once per module load.
// This prevents the "iconUrl not set" error.
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
};

// FIX: Create a child component to handle map updates safely.
// This prevents the "Map container is already initialized" error.
const MapUpdater = ({ center, markers }: { center?: MarkerData, markers: MarkerData[] }) => {
    const map = useMap();
    
    React.useEffect(() => {
        const validMarkers = markers.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number');

        if (validMarkers.length > 1) {
            const bounds = L.latLngBounds(validMarkers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (center) {
            map.setView([center.lat, center.lng], 15);
        }
    }, [center, markers, map]);

    return null; // This component does not render anything itself.
}

type LeafletMapComponentProps = {
  center?: MarkerData;
  markers?: MarkerData[];
};

const LeafletMapComponent = ({ center, markers = [] }: LeafletMapComponentProps) => {
    const initialCenter = center || (markers.length > 0 && markers[0]) || { lat: 19.4326, lng: -99.1332 };
    const validMarkers = markers.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number');

    return (
        <MapContainer center={[initialCenter.lat, initialCenter.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {validMarkers.map((pos, index) => (
                <Marker key={index} position={[pos.lat, pos.lng]} />
            ))}
            <MapUpdater center={center} markers={markers} />
        </MapContainer>
    );
};

export default LeafletMapComponent;
