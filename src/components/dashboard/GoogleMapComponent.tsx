
"use client";

import React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 19.4326,
  lng: -99.1332
};

type MarkerData = {
  lat: number;
  lng: number;
};

type GoogleMapComponentProps = {
  center?: MarkerData;
  markers?: MarkerData[];
};

const GoogleMapComponent = ({ center, markers = [] }: GoogleMapComponentProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  });

  const mapCenter = center || (markers.length > 0 ? markers[0] : defaultCenter);
  
  const validMarkers = markers.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number');

  if (loadError) {
    return <div>Error al cargar el mapa. Verifica la clave de API.</div>;
  }

  return isLoaded ? (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={15}
      >
        {validMarkers.map((pos, index) => (
          <MarkerF key={index} position={pos} />
        ))}
      </GoogleMap>
  ) : <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center"><p>Cargando mapa...</p></div>;
}

export default React.memo(GoogleMapComponent);
