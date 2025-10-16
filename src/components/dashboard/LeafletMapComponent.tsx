
"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issues with webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// This is required to make the marker icons work correctly in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

/**
 * A component to handle map updates imperatively.
 * This prevents the MapContainer from re-rendering.
 */
const MapUpdater = ({ center, markerPosition, markers }: LeafletMapComponentProps) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() || 15);
    } else if (markerPosition) {
        map.setView(markerPosition, map.getZoom() || 15);
    } else if (markers && markers.length > 0) {
        const bounds = L.latLngBounds(markers);
        if(bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }
  }, [center, markerPosition, markers, map]);
  
  return (
    <>
      {markerPosition && <Marker position={markerPosition}></Marker>}
      {markers && markers.map((pos, idx) => (
        <Marker key={idx} position={pos}></Marker>
      ))}
    </>
  );
}

type LeafletMapComponentProps = {
  center?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
  markers?: { lat: number; lng: number }[];
};

/**
 * The main map component. It renders the MapContainer once and uses
 * MapUpdater to handle all dynamic changes to markers and view.
 */
const LeafletMapComponent = ({ center, markerPosition, markers }: LeafletMapComponentProps) => {
  // Determine an initial center to instantiate the map. It won't be updated via props here.
  const initialCenter = center || markerPosition || (markers && markers.length > 0 ? markers[0] : undefined) || { lat: 19.4326, lng: -99.1332 };

  return (
    <MapContainer center={initialCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* MapUpdater will handle all subsequent updates to markers and center */}
      <MapUpdater center={center} markerPosition={markerPosition} markers={markers} />
    </MapContainer>
  );
};

export default LeafletMapComponent;
