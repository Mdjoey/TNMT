import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Sửa lỗi hiển thị icon ghim mặc định của Leaflet trong Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Điều khiển camera bản đồ khi tọa độ thay đổi
function MapController({ position, onChange }) {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom(), { duration: 1 });
    },
  });

  React.useEffect(() => {
    if (position[0] && position[1]) {
      map.flyTo(position, 15, { duration: 1.2 });
    }
  }, [position, map]);

  return null;
}

export default function LocationPickerMap({ lat, lng, onChange }) {
  const position = useMemo(() => [Number(lat) || 10.3541, Number(lng) || 105.7481], [lat, lng]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Hàm tìm tọa độ sử dụng Photon Geocoding API (hỗ trợ CORS 100% cho client, không bao giờ bị 403)
  const executeSearch = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    setSearchError('');

    try {
      // 1. Thử tìm kiếm qua API Photon (Komoot OSM) - Rất nhanh, hỗ trợ đầy đủ tiếng Việt và không chặn CORS
      const res = await axios.get('https://photon.komoot.io/api/', {
        params: {
          q: query,
          limit: 1,
          lang: 'default',
        },
        timeout: 6000,
      });

      if (res.data && res.data.features && res.data.features.length > 0) {
        // Photon trả về GeoJSON dạng [kinh độ, vĩ độ]
        const [lon, latVal] = res.data.features[0].geometry.coordinates;
        onChange(Number(latVal), Number(lon));
        setSearching(false);
        return;
      }

      // 2. Dự phòng (Fallback): Thử tìm kiếm qua Nominatim với param hợp lệ
      const nomRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
        timeout: 6000,
      });

      if (nomRes.data && nomRes.data.length > 0) {
        const place = nomRes.data[0];
        onChange(parseFloat(place.lat), parseFloat(place.lon));
      } else {
        setSearchError('Không tìm thấy vị trí. Hãy nhập rõ hơn (Ví dụ: Nhà Bè TP HCM, Sa Đéc Đồng Tháp, Đà Lạt...).');
      }
    } catch (err) {
      console.error("Lỗi Geocoding:", err);
      // Nếu mạng bị chặn, cung cấp fallback tọa độ một số địa phương phổ biến nếu người dùng gõ
      const lower = query.toLowerCase();
      if (lower.includes('nhà bè')) {
        onChange(10.6631, 106.7441);
      } else if (lower.includes('sa đéc') || lower.includes('đồng tháp')) {
        onChange(10.3045, 105.7481);
      } else if (lower.includes('đà lạt') || lower.includes('lâm đồng')) {
        onChange(11.9404, 108.4583);
      } else if (lower.includes('mộc châu') || lower.includes('sơn la')) {
        onChange(20.8447, 104.6473);
      } else if (lower.includes('củ chi')) {
        onChange(11.0062, 106.5135);
      } else {
        setSearchError('Không thể kết nối máy chủ bản đồ. Vui lòng kiểm tra lại kết nối mạng hoặc thử gõ kèm tên tỉnh/thành phố.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      executeSearch();
    }
  };

  const eventHandlers = useMemo(
    () => ({
      dragend(e) {
        const marker = e.target;
        const newPos = marker.getLatLng();
        onChange(newPos.lat, newPos.lng);
      },
    }),
    [onChange]
  );

  return (
    <div className="space-y-2 mt-3">
      {/* Khung tìm kiếm vị trí */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Nhập địa chỉ/khu vực (VD: Nhà Bè, Sa Đéc, Đà Lạt, Mộc Châu...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <button
          type="button"
          disabled={searching}
          onClick={executeSearch}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shrink-0 shadow-2xs cursor-pointer"
        >
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Tìm vị trí'}
        </button>
      </div>

      {searchError && (
        <p className="text-[11px] text-amber-600 font-medium px-1">{searchError}</p>
      )}

      {/* Bản đồ định vị */}
      <div className="rounded-2xl overflow-hidden border border-emerald-200 shadow-inner">
        <div className="h-64 w-full relative z-0">
          <MapContainer 
            center={position} 
            zoom={13} 
            scrollWheelZoom={false} 
            className="h-full w-full"
          >
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <Marker
              draggable={true}
              eventHandlers={eventHandlers}
              position={position}
            />
            <MapController position={position} onChange={onChange} />
          </MapContainer>
        </div>
        <div className="bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 font-medium flex justify-between items-center">
          <span>💡 Tìm kiếm vị trí xong, bạn có thể phóng to và kéo con ghim vào đúng vườn</span>
          <span className="font-mono font-bold">{position[0].toFixed(5)}, {position[1].toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
}