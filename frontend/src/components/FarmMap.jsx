import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Sửa icon marker mặc định của Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapResizer({ position }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(position, 13);
    }, 200);
    return () => clearTimeout(timer);
  }, [map, position]);
  return null;
}

export default function FarmMap({ farm }) {
  const lat = Number(farm?.latitude) || 10.9723;
  const lng = Number(farm?.longitude) || 106.4936;
  const position = [lat, lng];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          📍 Bản đồ vị trí vùng trồng
        </h2>
        <p className="text-gray-500 text-xs mt-1">Xác thực tọa độ định vị nông trại liên kết theo tiêu chuẩn VietGAP</p>
      </div>

      <div style={{ height: '320px', width: '100%' }} className="rounded-xl overflow-hidden border border-gray-100 relative z-0">
        <MapContainer 
          center={position} 
          zoom={13} 
          scrollWheelZoom={false} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          />
          <Marker position={position}>
            <Popup>
              <div className="font-sans text-xs">
                <p className="font-bold text-emerald-700">{farm?.name || 'Nông trại VietGAP'}</p>
                <p className="text-gray-600 mt-0.5">{farm?.address}</p>
                <p className="text-gray-400 mt-1 font-mono">GPS: {position[0]}, {position[1]}</p>
              </div>
            </Popup>
          </Marker>
          <MapResizer position={position} />
        </MapContainer>
      </div>
    </div>
  );
}