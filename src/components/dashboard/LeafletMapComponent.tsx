
"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issues with webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

type MapUpdaterProps = {
  center?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
  markers?: { lat: number; lng: number }[];
};

// This component will handle map updates.
const MapUpdater = ({ center, markerPosition, markers }: MapUpdaterProps) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    } else if (markerPosition) {
        map.setView(markerPosition, map.getZoom() || 15);
    } else if (markers && markers.length > 0) {
        const bounds = L.latLngBounds(markers);
        if(bounds.isValid()) {
            map.fitBounds(bounds);
        }
    }
  }, [center, map, markerPosition, markers]);
  
  return null;
}

type LeafletMapComponentProps = {
  center?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
  markers?: { lat: number; lng: number }[];
};

const LeafletMapComponent = ({ center, markerPosition, markers }: LeafletMapComponentProps) => {
  const initialCenter = center || markerPosition || (markers && markers.length > 0 ? markers[0] : { lat: 19.4326, lng: -99.1332 });
  
  return (
    <MapContainer center={initialCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {markerPosition && <Marker position={markerPosition}></Marker>}

      {markers && markers.map((pos, idx) => (
        <Marker key={idx} position={pos}></Marker>
      ))}

      <MapUpdater center={center} markerPosition={markerPosition} markers={markers} />
    </MapContainer>
  );
};

export default LeafletMapComponent;
