
"use client";

import { useEffect } from 'react';
import L, { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';

// Import marker images as suggested. This should be done once.
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

// Create a single, default icon instance.
const defaultIcon = new Icon({
    iconUrl: markerIconPng.src,
    shadowUrl: markerShadowPng.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
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

/**
 * A component that updates the map's view and markers when props change.
 * This should be rendered as a child of MapContainer.
 */
const MapUpdater = ({ markers, center }: { markers: MarkerData[], center?: { lat: number; lng: number }}) => {
    const map = useMap();

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

    return (
        <>
            {markers.map((pos, idx) => (
                <Marker key={idx} position={[pos.lat, pos.lng]} icon={defaultIcon}>
                    {pos.label && (
                        <Tooltip permanent direction="top" offset={[0, -15]} className="map-label">
                            {pos.label}
                        </Tooltip>
                    )}
                </Marker>
            ))}
        </>
    );
};

/**
 * The main map component. It renders the MapContainer and delegates dynamic updates
 * to the MapUpdater component.
 */
const LeafletMapComponent = ({ center, markerPosition, markers }: LeafletMapComponentProps) => {
    // Consolidate all markers into a single array.
    const allMarkersData: MarkerData[] = [];
    if (markerPosition) {
        allMarkersData.push(markerPosition);
    }
    if (markers) {
        allMarkersData.push(...markers);
    }

    // Determine the initial center of the map. This won't change on re-renders.
    const initialCenter = center || (allMarkersData.length > 0 ? allMarkersData[0] : undefined) || { lat: 19.4326, lng: -99.1332 };

    return (
        <MapContainer center={initialCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {/* The MapUpdater component handles all dynamic changes */}
            <MapUpdater markers={allMarkersData} center={center} />
        </MapContainer>
    );
};

export default LeafletMapComponent;
