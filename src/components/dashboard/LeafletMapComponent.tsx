
"use client";

import { useEffect, useRef } from 'react';
import L, { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';

// Import marker images as suggested
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

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

// Create a single, default icon instance as suggested
const defaultIcon = new Icon({
    iconUrl: markerIconPng.src,
    shadowUrl: markerShadowPng.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});


const MapUpdater = ({ markers, center }: { markers: MarkerData[], center?: { lat: number; lng: number }}) => {
    const map = L.useMap();
    useEffect(() => {
        if (markers.length > 1) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
             if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        } else if (markers.length === 1) {
            map.setView([markers[0].lat, markers[0].lng], 15);
        } else if (center) {
            map.setView(center, 15);
        }
    }, [map, markers, center]);

    return null;
}


const LeafletMapComponent = ({ center, markerPosition, markers }: LeafletMapComponentProps) => {
  const allMarkersData: MarkerData[] = [];
    if (markerPosition) {
        allMarkersData.push(markerPosition);
    }
    if (markers) {
        allMarkersData.push(...markers);
    }

  const initialCenter = center || (allMarkersData.length > 0 ? allMarkersData[0] : undefined) || { lat: 19.4326, lng: -99.1332 };

  return (
     <MapContainer center={initialCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
            url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {allMarkersData.map((pos, idx) => (
            <Marker key={idx} position={[pos.lat, pos.lng]} icon={defaultIcon}>
                {pos.label && (
                    <Tooltip permanent direction="top" offset={[0, -15]} className="map-label">
                        {pos.label}
                    </Tooltip>
                )}
            </Marker>
        ))}
        <MapUpdater markers={allMarkersData} center={center} />
    </MapContainer>
  );
};

export default LeafletMapComponent;
