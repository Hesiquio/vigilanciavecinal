"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

export default function GoogleMap() {
  const position = { lat: 19.4326, lng: -99.1332 };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <Map
        defaultCenter={position}
        defaultZoom={15}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        mapId="b1b2f2c2a3e4f5a6"
      >
        <Marker position={position} />
      </Map>
    </APIProvider>
  );
}
