"use client";

import { APIProvider, Map, Marker, Polygon } from "@vis.gl/react-google-maps";

type GoogleMapProps = {
  markerPosition?: { lat: number; lng: number };
  polygon?: { lat: number; lng: number }[];
};

export default function GoogleMap({ markerPosition, polygon }: GoogleMapProps) {
  // Center map on polygon or marker, otherwise default to Mexico City
  const center = polygon?.[0] || markerPosition || { lat: 19.4326, lng: -99.1332 };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <Map
        defaultCenter={center}
        defaultZoom={15}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        mapId="b1b2f2c2a3e4f5a6"
      >
        {markerPosition && <Marker position={markerPosition} />}
        {polygon && (
          <Polygon
            paths={polygon}
            strokeColor="hsl(var(--primary))"
            strokeOpacity={0.8}
            strokeWeight={2}
            fillColor="hsl(var(--primary))"
            fillOpacity={0.35}
          />
        )}
      </Map>
    </APIProvider>
  );
}
