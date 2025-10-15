"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

// Solución para el problema de íconos por defecto en Leaflet con Webpack/Next.js
// Esta parte se ejecuta solo una vez cuando el módulo se carga en el cliente.
useEffect(() => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });
}, []);


// Coordenadas de ejemplo para "Parque Central" (usando Zócalo, CDMX como placeholder)
const position: [number, number] = [19.4326, -99.1332];

export default function OpenStreetMap() {
  return (
    <MapContainer
      center={position}
      zoom={16}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="z-0" // Asegurar un z-index más bajo para que no interfiera con otros elementos UI.
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          Alerta: Actividad sospechosa aquí.
        </Popup>
      </Marker>
    </MapContainer>
  );
}
