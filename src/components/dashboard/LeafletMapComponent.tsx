
"use client";

import React from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import marker images directly
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default icon issue with Webpack
// This code should run once when the module is loaded
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

// This child component will handle map updates imperatively
const MapUpdater = ({ center, markers }: { center?: { lat: number; lng: number }, markers?: MarkerData[] }) => {
    const map = useMap();
    
    React.useEffect(() => {
        if (center) {
            map.setView([center.lat, center.lng], map.getZoom());
        } else if (markers && markers.length > 0) {
            const validMarkers = markers.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number');
            if (validMarkers.length > 0) {
                 map.fitBounds(L.latLngBounds(validMarkers.map(m => [m.lat, m.lng])));
            }
        }
    }, [center, markers, map]);

    return null;
}


const LeafletMapComponent = ({ center, markers = [] }: LeafletMapComponentProps) => {
    const initialCenter = center || (markers && markers.length > 0 && markers[0]) || { lat: 19.4326, lng: -99.1332 };

    const validMarkers = markers.filter(pos => pos && typeof pos.lat === 'number' && typeof pos.lng === 'number');

    return (
        <MapContainer center={[initialCenter.lat, initialCenter.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {validMarkers.map((pos, idx) => (
                <Marker key={idx} position={[pos.lat, pos.lng]}>
                    {pos.label && (
                         <Tooltip permanent direction="top" offset={[0, -15]} className="map-label">
                            {pos.label}
                        </Tooltip>
                    )}
                </Marker>
            ))}

            <MapUpdater center={center} markers={markers} />
        </MapContainer>
    );
};

export default LeafletMapComponent;
