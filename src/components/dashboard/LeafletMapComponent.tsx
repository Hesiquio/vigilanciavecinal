
"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Cleanup previous map instance
    if (mapRef.current) {
      mapRef.current.off();
      mapRef.current.remove();
      mapRef.current = null;
    }
    
    const allMarkersData: MarkerData[] = [];
    if (markerPosition) {
        allMarkersData.push(markerPosition);
    }
    if (markers) {
        allMarkersData.push(...markers);
    }

    const initialCenter = center || (allMarkersData.length > 0 ? allMarkersData[0] : undefined) || { lat: 19.4326, lng: -99.1332 };

    const map = L.map(mapContainerRef.current).setView(initialCenter, 15);
    mapRef.current = map;

    L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
        {
            attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
    ).addTo(map);

    const markerInstances: L.Marker[] = [];
    allMarkersData.forEach(pos => {
      if (pos) {
        const marker = L.marker([pos.lat, pos.lng]).addTo(map);
        if (pos.label) {
            marker.bindTooltip(pos.label, { permanent: true, direction: 'top', offset: [0, -15], className: 'map-label' }).openTooltip();
        }
        markerInstances.push(marker);
      }
    });

    if (markerInstances.length > 1) {
        const bounds = L.latLngBounds(markerInstances.map(m => m.getLatLng()));
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    } else if (markerInstances.length === 1) {
        map.setView(markerInstances[0].getLatLng(), 15);
    } else if (center) {
        map.setView(center, 15);
    }

    // Cleanup on component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, markerPosition, markers]); 
  
  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMapComponent;
