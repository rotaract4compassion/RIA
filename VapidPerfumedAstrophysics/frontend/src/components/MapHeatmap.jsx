import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function HeatmapLayer({ points, options }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // points is an array of [lat, lng, intensity]
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      ...options,
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points, options]);

  return null;
}

export default function MapHeatmap({
  data = [],
  center = [-6.7924, 39.2083], // Default: Dar es Salaam
  zoom = 6,
  height = '400px',
  options = {}
}) {
  // Convert {lat, lng} to [lat, lng, intensity]
  const heatPoints = data
    .filter(d => d.lat && d.lng)
    .map(d => [parseFloat(d.lat), parseFloat(d.lng), d.intensity || 1]);

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer points={heatPoints} options={options} />
      </MapContainer>
    </div>
  );
}
