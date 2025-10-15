"use client";

import { APIProvider, Map, useMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

type GoogleMapProps = {
  markerPosition?: { lat: number; lng: number };
  polygon?: { lat: number; lng: number }[];
};


const MapWithPolygon = ({ polygon }: { polygon?: { lat: number, lng: number }[]}) => {
  const map = useMap();

  useEffect(() => {
    if (map && polygon) {
      const polygonPath = new google.maps.Polygon({
        paths: polygon,
        strokeColor: "hsl(var(--primary))",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "hsl(var(--primary))",
        fillOpacity: 0.35,
      });
      polygonPath.setMap(map);
      
      return () => {
        polygonPath.setMap(null);
      }
    }
  }, [map, polygon]);

  return null;
}


export default function GoogleMap({ markerPosition, polygon }: GoogleMapProps) {
  // Center map on polygon or marker, otherwise default to Mexico City
  const center = polygon?.[0] || markerPosition || { lat: 19.4326, lng: -99.1332 };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} >
      <Map
        defaultCenter={center}
        defaultZoom={15}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        mapId="b1b2f2c2a3e4f5a6"
      >
        {markerPosition && <AdvancedMarker position={markerPosition} />}
        {polygon && <MapWithPolygon polygon={polygon} />}
      </Map>
    </APIProvider>
  );
}
